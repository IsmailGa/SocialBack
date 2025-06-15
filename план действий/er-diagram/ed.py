import pdfkit
import os

# Получаем путь к текущей директории


path_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)

# Конвертация HTML → PDF
pdfkit.from_file('erdiagram.html', 'erdiagram.pdf', configuration=config)