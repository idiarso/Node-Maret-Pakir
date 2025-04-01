from parking_client import ParkingClient
import time
import json
from datetime import datetime

def test_manual_entry():
    client = ParkingClient()
    
    print("""
================================
    MANUAL TESTING MENU    
================================
1. Test Online Entry
2. Test Offline Entry
3. Test Printer
4. Test Arduino
5. Sync Offline Data
6. Exit
    """)
    
    while True:
        choice = input("\nEnter your choice (1-6): ")
        
        if choice == "1":
            plate = input("Enter plate number (e.g., B1234XYZ): ")
            type = input("Enter vehicle type (Motor/Mobil): ")
            print("\nProcessing online entry...")
            response = client.send_entry_request(plate, type)
            if response:
                print("\nServer Response:")
                print(json.dumps(response, indent=2))
            
        elif choice == "2":
            plate = input("Enter plate number (e.g., B1234XYZ): ")
            type = input("Enter vehicle type (Motor/Mobil): ")
            print("\nProcessing offline entry...")
            client.process_entry(plate, type)
            
        elif choice == "3":
            print("\nTesting printer...")
            test_data = {
                'tiket': 'TEST123',
                'plat': 'B1234XYZ',
                'waktu': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            client.print_ticket(test_data)
            
        elif choice == "4":
            print("\nTesting Arduino...")
            if client.arduino:
                try:
                    client.arduino.write(b'TEST\n')
                    time.sleep(1)
                    while client.arduino.in_waiting:
                        response = client.arduino.readline().decode().strip()
                        print(f"Arduino response: {response}")
                except Exception as e:
                    print(f"Arduino test failed: {str(e)}")
            else:
                print("No Arduino device connected")
                
        elif choice == "5":
            print("\nSyncing offline data...")
            client.sync_offline_entries()
            
        elif choice == "6":
            print("\nExiting...")
            if client.arduino:
                client.arduino.close()
            break
            
        else:
            print("\nInvalid choice. Please try again.")

if __name__ == "__main__":
    test_manual_entry() 