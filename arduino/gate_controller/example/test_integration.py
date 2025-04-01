import unittest
import os
import json
import time
from datetime import datetime
from parking_client import ParkingClient
import requests
from unittest.mock import Mock, patch

class TestParkingClientIntegration(unittest.TestCase):
    def setUp(self):
        self.client = ParkingClient()
        self.test_plate = "B1234XYZ"
        self.test_type = "Motor"
        # Clean up any existing offline data
        if os.path.exists(self.client.offline_file):
            os.remove(self.client.offline_file)

    def test_server_connection(self):
        """Test server connectivity"""
        print("\nTesting server connection...")
        try:
            response = requests.get(f"{self.client.base_url}/test")
            self.assertTrue(response.ok)
            print("✅ Server connection successful")
        except requests.exceptions.RequestException:
            print("❌ Server connection failed")
            self.fail("Could not connect to server")

    def test_online_entry(self):
        """Test online vehicle entry"""
        print("\nTesting online entry...")
        response = self.client.send_entry_request(
            self.test_plate,
            self.test_type
        )
        self.assertIsNotNone(response)
        self.assertEqual(response['status'], 'success')
        print("✅ Online entry successful")
        print(f"Ticket number: {response['data']['ticket_number']}")

    def test_offline_entry(self):
        """Test offline entry functionality"""
        print("\nTesting offline entry...")
        # Mock network error
        with patch('requests.post') as mock_post:
            mock_post.side_effect = requests.exceptions.ConnectionError
            
            # Process entry in offline mode
            self.client.process_entry(self.test_plate, self.test_type)
            
            # Verify offline data was saved
            self.assertTrue(os.path.exists(self.client.offline_file))
            with open(self.client.offline_file, 'r') as f:
                offline_data = json.load(f)
            
            self.assertTrue(len(offline_data) > 0)
            self.assertEqual(offline_data[0]['plat'], self.test_plate)
            print("✅ Offline entry successful")
            print(f"Offline ticket number: {offline_data[0]['ticket_number']}")

    def test_offline_sync(self):
        """Test synchronization of offline entries"""
        print("\nTesting offline sync...")
        # Create some offline data
        offline_entry = {
            'plat': self.test_plate,
            'jenis': self.test_type,
            'ticket_number': f"OFF{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'entry_time': datetime.now().isoformat(),
            'is_offline': True
        }
        
        with open(self.client.offline_file, 'w') as f:
            json.dump([offline_entry], f)
        
        # Try to sync
        self.client.sync_offline_entries()
        
        # Verify sync was successful (file should be deleted after successful sync)
        if not os.path.exists(self.client.offline_file):
            print("✅ Offline sync successful")
        else:
            print("❌ Offline sync failed")
            with open(self.client.offline_file, 'r') as f:
                remaining_data = json.load(f)
            print(f"Remaining offline entries: {len(remaining_data)}")

    def test_printer_integration(self):
        """Test printer functionality"""
        print("\nTesting printer integration...")
        test_data = {
            'tiket': 'TEST123',
            'plat': self.test_plate,
            'waktu': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        success = self.client.print_ticket(test_data)
        if success:
            print("✅ Printer test successful")
        else:
            print("❌ Printer test failed")

    def test_arduino_integration(self):
        """Test Arduino communication"""
        print("\nTesting Arduino integration...")
        if self.client.arduino:
            try:
                self.client.arduino.write(b'TEST\n')
                time.sleep(1)
                response = self.client.arduino.readline().decode().strip()
                if response:
                    print(f"✅ Arduino responded: {response}")
                else:
                    print("❌ No response from Arduino")
            except Exception as e:
                print(f"❌ Arduino test failed: {str(e)}")
        else:
            print("ℹ️ No Arduino device connected")

    def test_full_entry_process(self):
        """Test complete entry process"""
        print("\nTesting full entry process...")
        try:
            # Process a vehicle entry
            self.client.process_entry(
                self.test_plate,
                self.test_type,
                None  # No image for test
            )
            print("✅ Full entry process completed")
        except Exception as e:
            print(f"❌ Full entry process failed: {str(e)}")
            self.fail(f"Full entry process failed: {str(e)}")

    def tearDown(self):
        """Clean up after tests"""
        if os.path.exists(self.client.offline_file):
            os.remove(self.client.offline_file)
        if self.client.arduino:
            self.client.arduino.close()

def run_tests():
    print("Starting Parking System Integration Tests")
    print("========================================")
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestParkingClientIntegration)
    
    # Run tests
    unittest.TextTestRunner(verbosity=2).run(suite)

if __name__ == '__main__':
    run_tests() 