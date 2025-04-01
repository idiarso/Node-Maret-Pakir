#include <SoftwareSerial.h>
#include <Servo.h>
#include <EEPROM.h>

// Pin Definitions
const int BUTTON_PIN = 2;        // Push button pin
const int BUZZER_PIN = 3;        // Buzzer pin
const int LED_PIN = 4;           // Status LED pin
const int SERVO_PIN = 5;         // Servo motor pin for gate control
const int RX_PIN = 10;           // Software serial RX pin
const int TX_PIN = 11;           // Software serial TX pin
const int TEST_MODE_PIN = 12;    // Test mode switch pin
const int VOLTAGE_SENSOR_PIN = A0; // Analog pin for voltage monitoring

// Constants
const int DEBOUNCE_DELAY = 50;   // Debounce delay in milliseconds
const int GATE_OPEN_ANGLE = 90;  // Gate open angle
const int GATE_CLOSED_ANGLE = 0; // Gate closed angle
const int MAX_RETRIES = 3;       // Maximum number of retries for operations
const int EEPROM_ADDR = 0;       // EEPROM address for configuration
const float VOLTAGE_THRESHOLD = 4.5; // Minimum voltage threshold (V)
const int SCANNER_TIMEOUT = 5000;    // Scanner timeout in milliseconds
const int GATE_TIMEOUT = 10000;      // Gate operation timeout in milliseconds

// Configuration structure
struct Config {
    int gateOpenTime;           // Time gate stays open (seconds)
    int buzzerVolume;          // Buzzer volume (0-255)
    bool testMode;             // Test mode flag
    bool debugMode;            // Debug mode flag
    int scannerTimeout;        // Scanner timeout (ms)
    int gateTimeout;          // Gate timeout (ms)
    float voltageThreshold;   // Voltage threshold (V)
    bool autoRetry;           // Enable automatic retry
    int maxRetries;           // Maximum retry attempts
};

// Global Variables
SoftwareSerial barcodeScanner(RX_PIN, TX_PIN); // RX, TX
Servo gateServo;
String barcodeData = "";
bool isGateOpen = false;
unsigned long lastDebounceTime = 0;
bool lastButtonState = HIGH;
bool buttonState = HIGH;
Config config;
unsigned long lastHealthCheck = 0;
int errorCount = 0;
bool isTestMode = false;
unsigned long scannerStartTime = 0;
unsigned long gateStartTime = 0;
float currentVoltage = 0.0;

// Error codes
enum ErrorCode {
    NO_ERROR = 0,
    SCANNER_ERROR = 1,
    GATE_ERROR = 2,
    COMMUNICATION_ERROR = 3,
    CONFIG_ERROR = 4,
    VOLTAGE_ERROR = 5,
    TIMEOUT_ERROR = 6,
    HARDWARE_ERROR = 7,
    MEMORY_ERROR = 8
};

// Test mode functions
enum TestFunction {
    TEST_LED = 0,
    TEST_BUZZER = 1,
    TEST_GATE = 2,
    TEST_SCANNER = 3,
    TEST_VOLTAGE = 4,
    TEST_MEMORY = 5,
    TEST_COMMUNICATION = 6
};

void setup() {
    // Initialize serial communication
    Serial.begin(9600);           // For debugging
    barcodeScanner.begin(9600);   // For barcode scanner

    // Initialize pins
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(LED_PIN, OUTPUT);
    pinMode(TEST_MODE_PIN, INPUT_PULLUP);
    pinMode(VOLTAGE_SENSOR_PIN, INPUT);
    gateServo.attach(SERVO_PIN);

    // Load configuration
    loadConfig();

    // Initial state
    gateServo.write(GATE_CLOSED_ANGLE);
    digitalWrite(LED_PIN, LOW);
    noTone(BUZZER_PIN);

    // Wait for barcode scanner to initialize
    delay(2000);

    // Perform initial health check
    performHealthCheck();
}

void loop() {
    // Check voltage
    checkVoltage();

    // Check for test mode toggle
    if (digitalRead(TEST_MODE_PIN) == LOW) {
        isTestMode = !isTestMode;
        handleTestModeToggle();
        delay(1000); // Debounce
    }

    // Read button state with debouncing
    bool reading = digitalRead(BUTTON_PIN);
    if (reading != lastButtonState) {
        lastDebounceTime = millis();
    }
    if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
        if (reading != buttonState) {
            buttonState = reading;
            if (buttonState == LOW) {  // Button pressed
                handleButtonPress();
            }
        }
    }
    lastButtonState = reading;

    // Check for barcode data with timeout
    if (barcodeScanner.available()) {
        scannerStartTime = millis();
        char c = barcodeScanner.read();
        if (c == '\n' || c == '\r') {
            if (barcodeData.length() > 0) {
                processBarcode();
                barcodeData = "";
            }
        } else {
            barcodeData += c;
        }
    } else if (millis() - scannerStartTime > config.scannerTimeout) {
        handleError(TIMEOUT_ERROR);
    }

    // Check gate operation timeout
    if (isGateOpen && (millis() - gateStartTime > config.gateTimeout)) {
        handleError(TIMEOUT_ERROR);
        closeGate();
    }

    // Periodic health check
    if (millis() - lastHealthCheck > 300000) { // Every 5 minutes
        performHealthCheck();
    }

    // Blink LED in test mode
    if (isTestMode) {
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        delay(500);
    }
}

void checkVoltage() {
    int rawValue = analogRead(VOLTAGE_SENSOR_PIN);
    currentVoltage = (rawValue * 5.0) / 1024.0; // Convert to voltage
    
    if (currentVoltage < config.voltageThreshold) {
        handleError(VOLTAGE_ERROR);
    }
}

void loadConfig() {
    // Read configuration from EEPROM
    EEPROM.get(EEPROM_ADDR, config);
    
    // Validate configuration
    if (config.gateOpenTime < 1 || config.gateOpenTime > 30) {
        config.gateOpenTime = 5; // Default 5 seconds
    }
    if (config.buzzerVolume < 0 || config.buzzerVolume > 255) {
        config.buzzerVolume = 128; // Default medium volume
    }
    if (config.scannerTimeout < 1000 || config.scannerTimeout > 10000) {
        config.scannerTimeout = SCANNER_TIMEOUT;
    }
    if (config.gateTimeout < 5000 || config.gateTimeout > 30000) {
        config.gateTimeout = GATE_TIMEOUT;
    }
    if (config.voltageThreshold < 3.0 || config.voltageThreshold > 5.0) {
        config.voltageThreshold = VOLTAGE_THRESHOLD;
    }
    if (config.maxRetries < 1 || config.maxRetries > 5) {
        config.maxRetries = MAX_RETRIES;
    }
    
    // Save validated configuration
    EEPROM.put(EEPROM_ADDR, config);
}

void performHealthCheck() {
    lastHealthCheck = millis();
    
    // Check memory
    if (!checkMemory()) {
        handleError(MEMORY_ERROR);
        return;
    }

    // Check voltage
    if (currentVoltage < config.voltageThreshold) {
        handleError(VOLTAGE_ERROR);
        return;
    }

    // Check barcode scanner
    if (!checkScanner()) {
        handleError(SCANNER_ERROR);
        return;
    }

    // Check gate servo
    if (!checkGate()) {
        handleError(GATE_ERROR);
        return;
    }

    // Check communication
    if (!checkCommunication()) {
        handleError(COMMUNICATION_ERROR);
        return;
    }

    // Reset error count if all checks pass
    errorCount = 0;
    sendStatus("HEALTH:OK");
}

bool checkMemory() {
    // Check if we can allocate and free memory
    void* testPtr = malloc(100);
    if (testPtr == NULL) {
        return false;
    }
    free(testPtr);
    return true;
}

bool checkScanner() {
    // Send test command to scanner
    barcodeScanner.write(0x1B);  // ESC
    barcodeScanner.write(0x74);  // 't'
    delay(100);
    return barcodeScanner.available();
}

bool checkGate() {
    // Test gate movement
    int currentPos = gateServo.read();
    gateServo.write(currentPos + 5);
    delay(100);
    gateServo.write(currentPos - 5);
    delay(100);
    gateServo.write(currentPos);
    return true;
}

bool checkCommunication() {
    // Send test message to computer
    Serial.println("TEST:COMM");
    return true;
}

void handleError(ErrorCode error) {
    errorCount++;
    
    // Send error report
    Serial.print("ERROR:");
    Serial.println(error);
    
    // Visual feedback
    for (int i = 0; i < error; i++) {
        digitalWrite(LED_PIN, HIGH);
        tone(BUZZER_PIN, 500, 100);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
    }
    
    // Handle critical errors
    if (errorCount >= config.maxRetries) {
        sendStatus("CRITICAL_ERROR");
        // Keep gate closed
        closeGate();
    } else if (config.autoRetry) {
        // Attempt recovery based on error type
        switch (error) {
            case SCANNER_ERROR:
                resetScanner();
                break;
            case GATE_ERROR:
                resetGate();
                break;
            case COMMUNICATION_ERROR:
                resetCommunication();
                break;
        }
    }
}

void resetScanner() {
    barcodeScanner.end();
    delay(100);
    barcodeScanner.begin(9600);
    delay(1000);
}

void resetGate() {
    gateServo.detach();
    delay(100);
    gateServo.attach(SERVO_PIN);
    delay(1000);
}

void resetCommunication() {
    Serial.end();
    delay(100);
    Serial.begin(9600);
    delay(1000);
}

void handleButtonPress() {
    if (isTestMode) {
        handleTestModeButton();
        return;
    }

    // Trigger barcode scanner
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 1000, 100, config.buzzerVolume);
    delay(100);
    digitalWrite(LED_PIN, LOW);

    // Send trigger command to barcode scanner
    barcodeScanner.write(0x1B);  // ESC character
    barcodeScanner.write(0x74);  // 't' character
}

void processBarcode() {
    // Validate barcode format (example: 13 digits)
    if (barcodeData.length() == 13) {
        // Send barcode data to computer
        Serial.print("BARCODE:");
        Serial.println(barcodeData);
        
        // Visual feedback
        digitalWrite(LED_PIN, HIGH);
        tone(BUZZER_PIN, 2000, 200, config.buzzerVolume);
        delay(200);
        digitalWrite(LED_PIN, LOW);

        // Open gate
        openGate();
    } else {
        // Invalid barcode
        tone(BUZZER_PIN, 500, 500, config.buzzerVolume);
        delay(500);
        sendStatus("INVALID_BARCODE");
    }
}

void openGate() {
    if (!isGateOpen) {
        gateStartTime = millis();
        gateServo.write(GATE_OPEN_ANGLE);
        isGateOpen = true;
        
        // Wait for vehicle to pass (configurable time)
        delay(config.gateOpenTime * 1000);
        
        // Close gate
        closeGate();
    }
}

void closeGate() {
    gateServo.write(GATE_CLOSED_ANGLE);
    isGateOpen = false;
}

void handleTestModeToggle() {
    isTestMode = !isTestMode;
    sendStatus(isTestMode ? "TEST_MODE:ON" : "TEST_MODE:OFF");
    
    // Visual feedback
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        tone(BUZZER_PIN, 1000, 100, config.buzzerVolume);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
    }
}

void handleTestModeButton() {
    // In test mode, button press cycles through test functions
    static TestFunction testFunction = TEST_LED;
    testFunction = (TestFunction)((testFunction + 1) % 7);
    
    switch (testFunction) {
        case TEST_LED:
            // Test LED
            digitalWrite(LED_PIN, HIGH);
            delay(500);
            digitalWrite(LED_PIN, LOW);
            sendStatus("TEST:LED");
            break;
            
        case TEST_BUZZER:
            // Test buzzer
            tone(BUZZER_PIN, 1000, 500, config.buzzerVolume);
            sendStatus("TEST:BUZZER");
            break;
            
        case TEST_GATE:
            // Test gate
            gateServo.write(GATE_OPEN_ANGLE);
            delay(1000);
            gateServo.write(GATE_CLOSED_ANGLE);
            sendStatus("TEST:GATE");
            break;
            
        case TEST_SCANNER:
            // Test scanner
            barcodeScanner.write(0x1B);
            barcodeScanner.write(0x74);
            sendStatus("TEST:SCANNER");
            break;

        case TEST_VOLTAGE:
            // Test voltage sensor
            int rawValue = analogRead(VOLTAGE_SENSOR_PIN);
            float voltage = (rawValue * 5.0) / 1024.0;
            char voltageStr[10];
            dtostrf(voltage, 1, 2, voltageStr);
            sendStatus("TEST:VOLTAGE:" + String(voltageStr));
            break;

        case TEST_MEMORY:
            // Test memory
            void* testPtr = malloc(100);
            if (testPtr != NULL) {
                free(testPtr);
                sendStatus("TEST:MEMORY:OK");
            } else {
                sendStatus("TEST:MEMORY:ERROR");
            }
            break;

        case TEST_COMMUNICATION:
            // Test communication
            Serial.println("TEST:COMM");
            sendStatus("TEST:COMM");
            break;
    }
}

void sendStatus(const char* status) {
    Serial.print("STATUS:");
    Serial.println(status);
} 