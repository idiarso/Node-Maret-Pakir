// Pin definitions
const int ENTRY_BUTTON_PIN = 2;    // Button untuk trigger entry
const int GATE_RELAY_PIN = 8;      // Relay untuk kontrol gate
const int ENTRY_LED_PIN = 12;      // LED indikator entry
const int PRINTER_TRIGGER_PIN = 4; // Trigger untuk printer
const int CAMERA_TRIGGER_PIN = 5;  // Trigger untuk kamera

// Timing constants
const unsigned long GATE_OPEN_TIME = 5000;  // Waktu gate terbuka (ms)
const unsigned long DEBOUNCE_DELAY = 50;    // Delay debounce (ms)

// State variables
bool gateOpen = false;
unsigned long gateOpenTime = 0;
unsigned long lastEntryDebounceTime = 0;
int lastEntryButtonState = HIGH;

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Configure pins
  pinMode(ENTRY_BUTTON_PIN, INPUT_PULLUP);
  pinMode(GATE_RELAY_PIN, OUTPUT);
  pinMode(ENTRY_LED_PIN, OUTPUT);
  pinMode(PRINTER_TRIGGER_PIN, OUTPUT);
  pinMode(CAMERA_TRIGGER_PIN, OUTPUT);
  
  // Initialize outputs
  digitalWrite(GATE_RELAY_PIN, LOW);
  digitalWrite(ENTRY_LED_PIN, LOW);
  digitalWrite(PRINTER_TRIGGER_PIN, LOW);
  digitalWrite(CAMERA_TRIGGER_PIN, LOW);
  
  // Send ready signal
  Serial.println("STATUS:READY");
}

void loop() {
  // Check for serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    handleSerialCommand(command);
  }
  
  // Handle entry button with debouncing
  handleEntryButton();
  
  // Auto-close gate after timeout
  if (gateOpen && (millis() - gateOpenTime >= GATE_OPEN_TIME)) {
    closeGate();
  }
}

void handleSerialCommand(String command) {
  command.trim();
  
  if (command == "OPEN_GATE") {
    openGate();
  }
  else if (command == "CLOSE_GATE") {
    closeGate();
  }
  else if (command == "TRIGGER_CAMERA") {
    triggerCamera();
  }
  else if (command == "TRIGGER_PRINTER") {
    triggerPrinter();
  }
  else if (command == "STATUS") {
    sendStatus();
  }
}

void handleEntryButton() {
  int reading = digitalRead(ENTRY_BUTTON_PIN);
  
  if (reading != lastEntryButtonState) {
    lastEntryDebounceTime = millis();
  }
  
  if ((millis() - lastEntryDebounceTime) > DEBOUNCE_DELAY) {
    if (reading == LOW && !gateOpen) {  // Button pressed and gate is closed
      Serial.println("IN:" + String(millis()));
      digitalWrite(ENTRY_LED_PIN, HIGH);
      delay(100);  // Brief LED flash
      digitalWrite(ENTRY_LED_PIN, LOW);
    }
  }
  
  lastEntryButtonState = reading;
}

void triggerCamera() {
  digitalWrite(CAMERA_TRIGGER_PIN, HIGH);
  delay(100);
  digitalWrite(CAMERA_TRIGGER_PIN, LOW);
  Serial.println("STATUS:CAMERA_TRIGGERED");
}

void triggerPrinter() {
  digitalWrite(PRINTER_TRIGGER_PIN, HIGH);
  delay(100);
  digitalWrite(PRINTER_TRIGGER_PIN, LOW);
  Serial.println("STATUS:PRINTER_TRIGGERED");
}

void openGate() {
  if (!gateOpen) {
    digitalWrite(GATE_RELAY_PIN, HIGH);
    gateOpen = true;
    gateOpenTime = millis();
    Serial.println("STATUS:GATE_OPENED");
  }
}

void closeGate() {
  if (gateOpen) {
    digitalWrite(GATE_RELAY_PIN, LOW);
    gateOpen = false;
    Serial.println("STATUS:GATE_CLOSED");
  }
}

void sendStatus() {
  Serial.println("STATUS:" + String(gateOpen ? "OPEN" : "CLOSED"));
} 