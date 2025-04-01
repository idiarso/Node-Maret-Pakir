import sys
import cv2
import numpy as np
import easyocr
import re

def preprocess_image(image):
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply bilateral filter to remove noise while keeping edges sharp
    bilateral = cv2.bilateralFilter(gray, 11, 17, 17)
    
    # Find edges using Canny
    edges = cv2.Canny(bilateral, 30, 200)
    
    # Find contours
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours by area and keep the largest ones
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    
    plate_contour = None
    plate_rect = None
    
    for contour in contours:
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        
        # Look for a rectangle-like contour
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / float(h)
            
            # Check if aspect ratio matches typical license plate dimensions
            if 2.0 <= aspect_ratio <= 5.5:
                plate_contour = approx
                plate_rect = (x, y, w, h)
                break
    
    if plate_rect is not None:
        x, y, w, h = plate_rect
        # Extract the plate region with some padding
        plate_img = gray[max(y-5,0):min(y+h+5,gray.shape[0]), 
                       max(x-5,0):min(x+w+5,gray.shape[1])]
        
        # Apply thresholding to make the text more visible
        _, plate_img = cv2.threshold(plate_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return plate_img
    
    return gray

def clean_plate_text(text):
    # Remove non-alphanumeric characters
    text = re.sub(r'[^A-Z0-9]', '', text.upper())
    
    # Check if the result matches common plate formats
    if len(text) >= 5 and len(text) <= 8:
        return text
    return None

def recognize_plate(image_path):
    # Read image
    image = cv2.imread(image_path)
    if image is None:
        print("Error: Could not read image file", file=sys.stderr)
        sys.exit(1)
    
    # Preprocess image
    processed_img = preprocess_image(image)
    
    # Initialize EasyOCR
    reader = easyocr.Reader(['en'])
    
    # Perform OCR
    results = reader.readtext(processed_img)
    
    # Process results
    for (bbox, text, prob) in results:
        # Clean and validate the text
        plate_number = clean_plate_text(text)
        if plate_number:
            print(plate_number)
            sys.exit(0)
    
    print("No valid plate number found", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python recognize_plate.py <image_path>", file=sys.stderr)
        sys.exit(1)
    
    recognize_plate(sys.argv[1]) 