import os
import sys
import json
import time
import serial
import requests
import win32print
import win32api
import serial.tools.list_ports
from datetime import datetime
from parking_client import ParkingClient

class SystemDiagnostics:
    def __init__(self):
        self.client = ParkingClient()
        self.issues_found = []
        self.fixes_applied = []
        self.test_ticket_data = {
            'tiket': 'TEST123',
            'plat': 'TEST-123',
            'waktu': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

    def check_server_connection(self):
        """Check server connectivity and API endpoints"""
        print("\n🔍 Checking server connection...")
        endpoints = [
            '/test',
            '/entry/',
            '/entry/sync_offline_entries/'
        ]
        
        for endpoint in endpoints:
            try:
                print(f"\nTesting endpoint: {endpoint}")
                response = requests.get(f"{self.client.base_url}{endpoint}", timeout=5)
                if response.ok:
                    print(f"✅ Endpoint {endpoint} is accessible")
                else:
                    self.issues_found.append(f"Endpoint {endpoint} returned status code: {response.status_code}")
                    print(f"❌ Endpoint {endpoint} returned error: {response.status_code}")
            except requests.exceptions.ConnectionError:
                self.issues_found.append(f"Cannot connect to endpoint: {endpoint}")
                print(f"❌ Cannot connect to endpoint: {endpoint}")
            except requests.exceptions.Timeout:
                self.issues_found.append(f"Timeout connecting to endpoint: {endpoint}")
                print(f"❌ Timeout connecting to endpoint: {endpoint}")
            except Exception as e:
                self.issues_found.append(f"Error accessing endpoint {endpoint}: {str(e)}")
                print(f"❌ Error accessing endpoint {endpoint}: {str(e)}")
        
        if self.issues_found:
            self._suggest_server_fixes()

    def _suggest_server_fixes(self):
        """Suggest fixes for server issues"""
        print("\n🔧 Suggested fixes:")
        print("1. Check if server URL is correct:", self.client.base_url)
        print("2. Verify server is running")
        print("3. Check network connectivity")
        print("4. Verify firewall settings")
        
        choice = input("\nWould you like to test a different server URL? (y/n): ")
        if choice.lower() == 'y':
            new_url = input("Enter new server URL: ")
            self.client.base_url = new_url
            print("Testing new URL...")
            self.check_server_connection()

    def check_printer(self):
        """Enhanced printer diagnostics"""
        print("\n🔍 Checking printer setup...")
        try:
            # List all printers
            printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL, None, 1)
            print("\nAvailable printers:")
            for i, printer in enumerate(printers, 1):
                print(f"{i}. {printer[2]}")
                try:
                    # Get printer status
                    handle = win32print.OpenPrinter(printer[2])
                    try:
                        status = win32print.GetPrinter(handle, 2)
                        if status['Status'] == 0:
                            print("   ✅ Ready")
                        else:
                            print("   ⚠️ Issues detected:")
                            if status['Status'] & win32print.PRINTER_STATUS_PAPER_OUT:
                                print("   - Out of paper")
                            if status['Status'] & win32print.PRINTER_STATUS_PAPER_JAM:
                                print("   - Paper jam")
                            if status['Status'] & win32print.PRINTER_STATUS_OFFLINE:
                                print("   - Printer offline")
                    finally:
                        win32print.ClosePrinter(handle)
                except Exception as e:
                    print(f"   ❌ Could not get status: {str(e)}")

            # Check configured printer
            if self.client.printer_name:
                print(f"\nConfigured printer: {self.client.printer_name}")
                if any(self.client.printer_name == p[2] for p in printers):
                    print("✅ Configured printer is available")
                    # Test print
                    self._test_print()
                else:
                    self.issues_found.append("Configured printer not found")
                    print("❌ Configured printer not found")
                    self._suggest_printer_fixes(printers)
            else:
                self.issues_found.append("No printer configured")
                print("❌ No printer configured")
                self._suggest_printer_fixes(printers)

        except Exception as e:
            self.issues_found.append(f"Printer error: {str(e)}")
            print(f"❌ Printer error: {str(e)}")

    def _test_print(self):
        """Test printer with sample ticket"""
        print("\nTesting printer with sample ticket...")
        try:
            success = self.client.print_ticket(self.test_ticket_data)
            if success:
                print("✅ Test print successful")
            else:
                print("❌ Test print failed")
                self.issues_found.append("Test print failed")
        except Exception as e:
            print(f"❌ Test print error: {str(e)}")
            self.issues_found.append(f"Test print error: {str(e)}")

    def _suggest_printer_fixes(self, printers):
        """Suggest fixes for printer issues"""
        print("\n🔧 Suggested fixes:")
        print("1. Select an available printer:")
        for i, printer in enumerate(printers, 1):
            print(f"   {i}. {printer[2]}")
        
        choice = input("\nSelect printer number (or 0 to skip): ")
        try:
            choice = int(choice)
            if 0 < choice <= len(printers):
                self.client.printer_name = printers[choice-1][2]
                print(f"Selected printer: {self.client.printer_name}")
                self.fixes_applied.append(f"Changed printer to: {self.client.printer_name}")
        except ValueError:
            pass

    def check_arduino(self):
        """Enhanced Arduino diagnostics"""
        print("\n🔍 Checking Arduino connection...")
        
        # List all COM ports with detailed info
        ports = list(serial.tools.list_ports.comports())
        print("\nAvailable COM ports:")
        for i, port in enumerate(ports, 1):
            print(f"{i}. {port.device}")
            print(f"   Description: {port.description}")
            print(f"   Hardware ID: {port.hwid}")
            print(f"   Manufacturer: {port.manufacturer if hasattr(port, 'manufacturer') else 'Unknown'}")
            print(f"   Product: {port.product if hasattr(port, 'product') else 'Unknown'}")

        if self.client.arduino:
            print(f"\nCurrently connected to: {self.client.arduino.port}")
            self._test_arduino_communication()
        else:
            self.issues_found.append("Arduino not connected")
            print("❌ Arduino not connected")
            self._suggest_arduino_fixes(ports)

    def _test_arduino_communication(self):
        """Detailed Arduino communication test"""
        try:
            # Test basic communication
            print("\nTesting Arduino communication...")
            self.client.arduino.write(b'TEST\n')
            time.sleep(1)
            
            # Read response with timeout
            start_time = time.time()
            response = ""
            while time.time() - start_time < 3:  # 3 second timeout
                if self.client.arduino.in_waiting:
                    response += self.client.arduino.readline().decode().strip()
                    break
                time.sleep(0.1)
            
            if response:
                print(f"✅ Arduino responded: {response}")
                # Test specific commands
                self._test_arduino_commands()
            else:
                self.issues_found.append("No response from Arduino")
                print("❌ No response from Arduino")
                self._suggest_arduino_fixes([])
                
        except Exception as e:
            self.issues_found.append(f"Arduino communication error: {str(e)}")
            print(f"❌ Arduino communication error: {str(e)}")
            self._suggest_arduino_fixes([])

    def _test_arduino_commands(self):
        """Test specific Arduino commands"""
        commands = [
            ('STATUS', 'Check status'),
            ('GATE:TEST', 'Test gate movement'),
            ('SENSOR:TEST', 'Test sensors')
        ]
        
        print("\nTesting Arduino commands:")
        for cmd, desc in commands:
            try:
                print(f"\nTesting: {desc}")
                self.client.arduino.write(f"{cmd}\n".encode())
                time.sleep(1)
                if self.client.arduino.in_waiting:
                    response = self.client.arduino.readline().decode().strip()
                    print(f"Response: {response}")
                else:
                    print("❌ No response")
                    self.issues_found.append(f"No response to {cmd} command")
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                self.issues_found.append(f"Error with {cmd} command: {str(e)}")

    def check_offline_data(self):
        """Check offline data integrity and sync status"""
        print("\n🔍 Checking offline data...")
        
        if os.path.exists(self.client.offline_file):
            try:
                with open(self.client.offline_file, 'r') as f:
                    offline_data = json.load(f)
                print(f"Found {len(offline_data)} offline entries")
                
                # Validate data structure
                for entry in offline_data:
                    required_fields = ['plat', 'jenis', 'ticket_number', 'entry_time']
                    missing_fields = [field for field in required_fields if field not in entry]
                    if missing_fields:
                        self.issues_found.append(f"Invalid offline entry: missing {missing_fields}")
                        print(f"❌ Invalid entry found: {entry['ticket_number'] if 'ticket_number' in entry else 'Unknown'}")
                
                if self.issues_found:
                    self._suggest_offline_fixes(offline_data)
                else:
                    print("✅ Offline data is valid")
                    
            except json.JSONDecodeError:
                self.issues_found.append("Corrupted offline data file")
                print("❌ Offline data file is corrupted")
                self._suggest_offline_fixes()
        else:
            print("ℹ️ No offline data file found")

    def _suggest_offline_fixes(self, offline_data=None):
        """Suggest fixes for offline data issues"""
        print("\n🔧 Suggested fixes:")
        print("1. Backup corrupted data")
        print("2. Remove invalid entries")
        print("3. Force sync with server")
        print("4. Clear offline data")
        
        choice = input("\nSelect fix to apply (1-4): ")
        
        if choice == "1" and offline_data:
            backup_file = f"offline_data_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
            with open(backup_file, 'w') as f:
                json.dump(offline_data, f, indent=2)
            print(f"✅ Backup created: {backup_file}")
            self.fixes_applied.append(f"Created offline data backup: {backup_file}")
            
        elif choice == "2" and offline_data:
            valid_entries = []
            for entry in offline_data:
                if all(field in entry for field in ['plat', 'jenis', 'ticket_number', 'entry_time']):
                    valid_entries.append(entry)
            
            with open(self.client.offline_file, 'w') as f:
                json.dump(valid_entries, f, indent=2)
            print(f"✅ Removed {len(offline_data) - len(valid_entries)} invalid entries")
            self.fixes_applied.append("Cleaned up invalid offline entries")
            
        elif choice == "3":
            self.client.sync_offline_entries()
            print("✅ Forced sync attempt completed")
            
        elif choice == "4":
            if os.path.exists(self.client.offline_file):
                os.remove(self.client.offline_file)
                print("✅ Offline data cleared")
                self.fixes_applied.append("Cleared offline data")

    def check_system_resources(self):
        """Check system resources and requirements"""
        print("\n🔍 Checking system resources...")
        
        # Check Python version
        print("\nPython version:", sys.version.split()[0])
        
        # Check disk space
        try:
            total, used, free = self._get_disk_space()
            print(f"\nDisk space:")
            print(f"Total: {total:.2f} GB")
            print(f"Used: {used:.2f} GB")
            print(f"Free: {free:.2f} GB")
            
            if free < 1:  # Less than 1GB free
                self.issues_found.append("Low disk space")
                print("⚠️ Warning: Low disk space")
        except Exception as e:
            print(f"❌ Error checking disk space: {str(e)}")

        # Check required files
        required_files = [
            'parking_client.py',
            'offline_data.json',
            'printer.ini',
            'camera.ini'
        ]
        
        print("\nChecking required files:")
        for file in required_files:
            if os.path.exists(file):
                print(f"✅ {file} found")
            else:
                self.issues_found.append(f"Missing file: {file}")
                print(f"❌ {file} not found")

    def _get_disk_space(self):
        """Get disk space information"""
        if os.name == 'nt':  # Windows
            free_bytes = win32api.GetDiskFreeSpaceEx(os.getcwd())[0]
            total_bytes = win32api.GetDiskFreeSpaceEx(os.getcwd())[1]
            used_bytes = total_bytes - free_bytes
            return (total_bytes/1024/1024/1024, 
                   used_bytes/1024/1024/1024,
                   free_bytes/1024/1024/1024)
        else:  # Linux/Unix
            st = os.statvfs(os.getcwd())
            free = st.f_bavail * st.f_frsize
            total = st.f_blocks * st.f_frsize
            used = (st.f_blocks - st.f_bfree) * st.f_frsize
            return (total/1024/1024/1024,
                   used/1024/1024/1024,
                   free/1024/1024/1024)

    def run_diagnostics(self):
        """Run all diagnostic checks"""
        print("Starting System Diagnostics")
        print("==========================")
        
        self.check_system_resources()
        self.check_server_connection()
        self.check_printer()
        self.check_arduino()
        self.check_offline_data()
        
        print("\nDiagnostics Summary")
        print("===================")
        if self.issues_found:
            print("\n❌ Issues Found:")
            for issue in self.issues_found:
                print(f"- {issue}")
        else:
            print("\n✅ No issues found")
            
        if self.fixes_applied:
            print("\n🔧 Fixes Applied:")
            for fix in self.fixes_applied:
                print(f"- {fix}")

def main():
    diagnostics = SystemDiagnostics()
    
    while True:
        print("""
=================================
    TROUBLESHOOTING MENU    
=================================
1. Run All Diagnostics
2. Check Server Connection
3. Check Printer
4. Check Arduino
5. Check Offline Data
6. Check System Resources
7. Test Printer
8. Test Arduino Commands
9. Exit
        """)
        
        choice = input("Enter your choice (1-9): ")
        
        if choice == "1":
            diagnostics.run_diagnostics()
        elif choice == "2":
            diagnostics.check_server_connection()
        elif choice == "3":
            diagnostics.check_printer()
        elif choice == "4":
            diagnostics.check_arduino()
        elif choice == "5":
            diagnostics.check_offline_data()
        elif choice == "6":
            diagnostics.check_system_resources()
        elif choice == "7":
            diagnostics._test_print()
        elif choice == "8":
            if diagnostics.client.arduino:
                diagnostics._test_arduino_commands()
            else:
                print("❌ Arduino not connected")
        elif choice == "9":
            print("\nExiting troubleshooter...")
            break
        else:
            print("\nInvalid choice. Please try again.")
        
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    main() 