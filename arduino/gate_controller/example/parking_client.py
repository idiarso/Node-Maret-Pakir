import logging
import json
import os
from datetime import datetime
import requests
import serial
import serial.tools.list_ports
import time
import win32print
import win32ui
from PIL import Image, ImageDraw, ImageFont, ImageWin
import barcode
from barcode.writer import ImageWriter
import base64
from io import BytesIO

# Setup logging
logging.basicConfig(
    filename='parking_client.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('parking_client')

class ParkingClient:
    def __init__(self):
        self.base_url = "http://192.168.2.6:8000/api"  # Update with your server URL
        self.offline_file = "offline_data.json"
        self.device_id = "GATE_01"  # Unique identifier for this entry gate
        self.printer = None
        self.arduino = None
        self.printer_name = None
        self.initialize_devices()

    def initialize_devices(self):
        """Initialize hardware devices"""
        self.initialize_printer()
        self.initialize_arduino()

    def initialize_printer(self):
        """Initialize printer connection"""
        try:
            printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL, None, 1)
            logger.info(f"Available printers: {printers}")
            
            # Look for EPSON printer
            for printer in printers:
                printer_name = printer[2]
                if "EPSON" in printer_name.upper() or "TM-T" in printer_name.upper():
                    self.printer_name = printer_name
                    logger.info(f"Found EPSON printer: {printer_name}")
                    print(f"✅ Printer detected: {printer_name}")
                    return
            
            # Fallback to default printer
            self.printer_name = win32print.GetDefaultPrinter()
            logger.info(f"Using default printer: {self.printer_name}")
            print(f"ℹ️ Using default printer: {self.printer_name}")
            
        except Exception as e:
            logger.error(f"Printer initialization error: {str(e)}")
            print("❌ Failed to initialize printer")
            self.printer_name = None

    def initialize_arduino(self):
        """Initialize Arduino connection"""
        try:
            arduino_port = self.find_arduino_port()
            if arduino_port:
                self.arduino = serial.Serial(arduino_port, 9600, timeout=1)
                time.sleep(2)  # Wait for Arduino reset
                logger.info(f"Arduino connected on port {arduino_port}")
                print(f"✅ Arduino detected on port {arduino_port}")
            else:
                logger.error("No Arduino device found")
                print("❌ No Arduino device found")
                self.arduino = None
        except Exception as e:
            logger.error(f"Arduino initialization error: {str(e)}")
            print("❌ Failed to initialize Arduino")
            self.arduino = None

    def find_arduino_port(self):
        """Find Arduino COM port"""
        ports = list(serial.tools.list_ports.comports())
        for port in ports:
            if "arduino" in port.description.lower() or "ch340" in port.description.lower():
                return port.device
        return None

    def create_ticket_image(self, data):
        # Create image with white background
        width = 400
        height = 600
        image = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(image)
        
        try:
            # Try to load a nice font, fallback to default if not found
            try:
                font_header = ImageFont.truetype("arial.ttf", 24)
                font_normal = ImageFont.truetype("arial.ttf", 20)
            except:
                font_header = ImageFont.load_default()
                font_normal = ImageFont.load_default()

            # Header
            draw.text((width//2, 20), "RSI BANJARNEGARA", font=font_header, fill='black', anchor='mt')
            draw.text((width//2, 50), "================", font=font_header, fill='black', anchor='mt')

            # Ticket details
            draw.text((20, 100), f"TIKET: {data['tiket']}", font=font_normal, fill='black')
            draw.text((20, 140), f"PLAT : {data['plat']}", font=font_normal, fill='black')
            draw.text((20, 180), f"WAKTU: {data['waktu']}", font=font_normal, fill='black')

            # Generate barcode
            barcode_class = barcode.get_barcode_class('code39')
            barcode_instance = barcode_class(data['tiket'], writer=ImageWriter())
            barcode_image = barcode_instance.render()
            
            # Resize barcode to fit ticket width
            barcode_image = barcode_image.resize((width-40, 100))
            
            # Paste barcode
            image.paste(barcode_image, (20, 240))

            return image

        except Exception as e:
            logger.error(f"Error creating ticket image: {str(e)}")
            return None

    def print_ticket(self, data):
        if not self.printer_name:
            logger.warning("No printer available")
            print("❌ Tidak ada printer yang tersedia")
            return False
            
        try:
            # Create ticket image
            ticket_image = self.create_ticket_image(data)
            if not ticket_image:
                return False

            # Save temporary file
            temp_file = "temp_ticket.bmp"
            ticket_image.save(temp_file)

            # Print using default Windows printer
            hprinter = win32print.OpenPrinter(self.printer_name)
            try:
                hdc = win32ui.CreateDC()
                hdc.CreatePrinterDC(self.printer_name)
                
                # Start print job
                hdc.StartDoc('Parking Ticket')
                hdc.StartPage()
                
                # Load and print image
                dib = ImageWin.Dib(ticket_image)
                dib.draw(hdc.GetHandleOutput(), (0, 0, ticket_image.width, ticket_image.height))
                
                # End print job
                hdc.EndPage()
                hdc.EndDoc()
                
                logger.info(f"Ticket printed successfully: {data['tiket']}")
                print("✅ Tiket berhasil dicetak")
                return True
                
            finally:
                win32print.ClosePrinter(hprinter)
                # Clean up
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            
        except Exception as e:
            logger.error(f"Error printing ticket: {str(e)}")
            print(f"❌ Gagal mencetak tiket: {str(e)}")
            return False

    def get_next_ticket_number(self):
        try:
            if os.path.exists(self.offline_file):
                with open(self.offline_file, 'r') as f:
                    offline_data = json.load(f)
            else:
                offline_data = []
            
            counter = len(offline_data) + 1
            ticket_number = f"OFF{str(counter).zfill(4)}"
            return ticket_number
        except Exception as e:
            logger.error(f"Error getting ticket number: {str(e)}")
            return None

    def save_offline_data(self, data):
        try:
            offline_data = []
            if os.path.exists(self.offline_file):
                with open(self.offline_file, 'r') as f:
                    offline_data = json.load(f)
            
            offline_data.append(data)
            with open(self.offline_file, 'w') as f:
                json.dump(offline_data, f, indent=2)
            
            logger.info(f"Data saved offline: {data}")
        except Exception as e:
            logger.error(f"Error saving offline data: {str(e)}")

    def test_connection(self):
        try:
            response = requests.get(f"{self.base_url}/test")
            if response.ok:
                return True, response.json()
            return False, None
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False, None

    def send_entry_request(self, plate_number, vehicle_type, image_path=None):
        """Send entry request to server"""
        try:
            data = {
                'plat': plate_number,
                'jenis': vehicle_type,
                'device_id': self.device_id
            }

            # Add image if available
            if image_path and os.path.exists(image_path):
                with open(image_path, 'rb') as img:
                    image_data = base64.b64encode(img.read()).decode()
                    data['entry_image'] = image_data

            # Try to send request to server
            response = requests.post(
                f"{self.base_url}/entry/",
                json=data,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code == 201:
                logger.info("Entry request successful")
                return response.json()
            else:
                logger.error(f"Entry request failed: {response.text}")
                self.save_offline_entry(data)
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error: {str(e)}")
            self.save_offline_entry(data)
            return None

    def save_offline_entry(self, data):
        """Save entry data for offline mode"""
        try:
            # Generate offline ticket number
            data['ticket_number'] = f"OFF{datetime.now().strftime('%Y%m%d%H%M%S')}"
            data['entry_time'] = datetime.now().isoformat()
            data['is_offline'] = True

            offline_entries = []
            if os.path.exists(self.offline_file):
                with open(self.offline_file, 'r') as f:
                    offline_entries = json.load(f)

            offline_entries.append(data)

            with open(self.offline_file, 'w') as f:
                json.dump(offline_entries, f, indent=2)

            logger.info(f"Saved offline entry: {data['ticket_number']}")
            return data

        except Exception as e:
            logger.error(f"Error saving offline entry: {str(e)}")
            return None

    def sync_offline_entries(self):
        """Synchronize offline entries with server"""
        if not os.path.exists(self.offline_file):
            return

        try:
            with open(self.offline_file, 'r') as f:
                offline_entries = json.load(f)

            if not offline_entries:
                return

            response = requests.post(
                f"{self.base_url}/entry/sync_offline_entries/",
                json={'entries': offline_entries}
            )

            if response.status_code == 200:
                logger.info("Offline entries synced successfully")
                os.remove(self.offline_file)
            else:
                logger.error(f"Failed to sync offline entries: {response.text}")

        except Exception as e:
            logger.error(f"Error syncing offline entries: {str(e)}")

    def process_entry(self, plate_number, vehicle_type, image_path=None):
        """Process vehicle entry"""
        # Try online entry first
        response = self.send_entry_request(plate_number, vehicle_type, image_path)
        
        if response:
            # Online mode - print ticket with server data
            success = self.print_ticket(response['data'])
            if success:
                print("✅ Entry processed and ticket printed")
            else:
                print("❌ Failed to print ticket")
        else:
            # Offline mode - create and print offline ticket
            offline_data = self.save_offline_entry({
                'plat': plate_number,
                'jenis': vehicle_type,
                'entry_time': datetime.now().isoformat()
            })
            
            if offline_data:
                success = self.print_ticket(offline_data)
                if success:
                    print("✅ Offline entry processed and ticket printed")
                else:
                    print("❌ Failed to print offline ticket")
            else:
                print("❌ Failed to process offline entry")

        # Try to sync any pending offline entries
        self.sync_offline_entries()

    def run(self):
        """Main loop"""
        print("""
================================
    PARKING ENTRY SYSTEM    
================================
Mode: Server Integration
Status: Ready for vehicles...
        """)
        
        try:
            while True:
                if self.arduino and self.arduino.in_waiting:
                    signal = self.arduino.readline().decode().strip()
                    if signal.startswith("IN:"):
                        print("\nProcessing vehicle entry...")
                        # In a real implementation, you would:
                        # 1. Capture image from camera
                        # 2. Get plate number (manual input or OCR)
                        # 3. Get vehicle type (manual input or detection)
                        # For demo, we'll use dummy data:
                        self.process_entry("B1234XYZ", "Motor")
                
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print("\nSystem shutting down...")
        finally:
            if self.arduino:
                self.arduino.close()

def main():
    client = ParkingClient()
    client.run()

if __name__ == "__main__":
    main() 