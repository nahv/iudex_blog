# -*- coding: utf-8 -*-
"""Une las slides de un carrusel en un PDF (documento de LinkedIn).
Uso: python3 -I a_pdf.py salida.pdf slide1.jpg slide2.jpg …"""
import sys

from PIL import Image

salida, *slides = sys.argv[1:]
imgs = [Image.open(s).convert('RGB') for s in slides]
imgs[0].save(salida, save_all=True, append_images=imgs[1:], resolution=144)
