// Pin definitions
const int ENTRY_BUTTON_PIN = 2;
const int EXIT_BUTTON_PIN = 3;
const int GATE_RELAY_PIN = 8;
const int ENTRY_LED_PIN = 12;
const int EXIT_LED_PIN = 13;

// Gate timing constants
const unsigned long GATE_OPEN_TIME = 5000;  // Time gate stays open in milliseconds
const unsigned long DEBOUNCE_DELAY = 50;    // Button debounce delay in milliseconds

// State variables
bool gateOpen = false;
unsigned long gateOpenTime = 0;
unsigned long lastEntryDebounceTime = 0;
unsigned long lastExitDebounceTime = 0;
int lastEntryButtonState = HIGH;
int lastExitButtonState = HIGH;

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Configure pins
  pinMode(ENTRY_BUTTON_PIN, INPUT_PULLUP);
  pinMode(EXIT_BUTTON_PIN, INPUT_PULLUP);
  pinMode(GATE_RELAY_PIN, OUTPUT);
  pinMode(ENTRY_LED_PIN, OUTPUT);
  pinMode(EXIT_LED_PIN, OUTPUT);
  
  // Initialize gate in closed position
  digitalWrite(GATE_RELAY_PIN, LOW);
  digitalWrite(ENTRY_LED_PIN, LOW);
  digitalWrite(EXIT_LED_PIN, LOW);
  
  // Send ready signal
  Serial.println("STATUS:READY");
}

void loop() {
  // Check for serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    handleSerialCommand(command);
  }
  
  // Handle button inputs with debouncing
  handleEntryButton();
  handleExitButton();
  
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

void handleExitButton() {
  int reading = digitalRead(EXIT_BUTTON_PIN);
  
  if (reading != lastExitButtonState) {
    lastExitDebounceTime = millis();
  }
  
  if ((millis() - lastExitDebounceTime) > DEBOUNCE_DELAY) {
    if (reading == LOW && !gateOpen) {  // Button pressed and gate is closed
      Serial.println("OUT:" + String(millis()));
      digitalWrite(EXIT_LED_PIN, HIGH);
      delay(100);  // Brief LED flash
      digitalWrite(EXIT_LED_PIN, LOW);
    }
  }
  
  lastExitButtonState = reading;
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