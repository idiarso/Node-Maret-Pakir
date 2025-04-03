import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface LocalBarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
}

const LocalBarcodeGenerator: React.FC<LocalBarcodeGeneratorProps> = ({ 
  value, 
  width = 200, 
  height = 80 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Bersihkan canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Pengaturan barcode sederhana
    const cleanValue = value.replace(/\s/g, '').toUpperCase();
    const barWidth = 2;
    const margin = 10;
    const availableWidth = width - (margin * 2);
    const barsCount = Math.min(cleanValue.length * 3, Math.floor(availableWidth / barWidth));
    
    ctx.fillStyle = 'black';
    
    // Gambar barcode sederhana
    let x = margin;
    for (let i = 0; i < barsCount; i++) {
      const charIndex = i % cleanValue.length;
      const char = cleanValue.charCodeAt(charIndex);
      
      // Tentukan ketinggian bar berdasarkan karakter
      const barHeight = height - (margin * 2) - (char % 20);
      
      // Gambar hanya bar hitam jika posisi ganjil atau char genap
      if (i % 2 === 0 || char % 2 === 0) {
        ctx.fillRect(x, margin, barWidth, barHeight);
      }
      
      x += barWidth;
    }
    
    // Tuliskan nilai teks di bawah barcode
    ctx.font = '12px monospace';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(value, width / 2, height - 5);
    
  }, [value, width, height]);
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </Box>
  );
};

export default LocalBarcodeGenerator; 