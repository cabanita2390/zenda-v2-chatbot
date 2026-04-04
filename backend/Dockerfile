# 1. Imagen Base (Sistema Operativo Ligero con Python)
# Usamos 'python:3.11-slim' porque ya viene con Python listo y es muy liviana para producción.
FROM python:3.11-slim

# 2. Configuración de Variables de Entorno de Python
# PYTHONUNBUFFERED=1 obliga a Python a imprimir los logs de inmediato (sin guardarlos en buffer).
# PYTHONDONTWRITEBYTECODE=1 evita archivos .pyc innecesarios dentro del contenedor.
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 3. Directorio de Trabajo
# Esto crea y entra a una carpeta llamada /app donde vivirá nuestro código en el contenedor.
WORKDIR /app

# 4. Instalación de Dependencias del Sistema (Si se necesitan para librerías de Python)
# Algunas librerías como asyncpg pueden necesitar dependencias de compilación de postgres.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Copiar Archivo de Requerimientos
# Copiamos solo el archivo de requisitos primero para aprovechar la memoria caché de Docker.
COPY requirements.txt .

# 6. Instalar Librerías
# Instalamos las librerías directamente en el contenedor (no necesitamos un 'venv' aquí adentro).
RUN pip install --no-cache-dir -r requirements.txt

# 7. Copiar el Código Fuente
# Copiamos todo el contenido de la carpeta /backend de tu compu a la carpeta /app del contenedor.
COPY . .

# 8. Puerto de Escucha
# Render asignará automáticamente un puerto a través de la variable de entorno PORT.
# No necesitamos EXPOSE pero es buena práctica saber que nuestra app corre habitualmente.
EXPOSE 8000

# -w 2: Dos trabajadores (mejor para instancias pequeñas en Render).
# --timeout 120: Esperar hasta 2 minutos antes de matar un trabajador que no responde (útil en arranques lentos).
CMD gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --timeout 120
