from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
import os

app = FastAPI()

# Montarea directorului static pentru fișiere HTML, CSS, etc.
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configurare CORS pentru a permite accesul de la alte domenii
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Înlocuiește "*" cu domeniul tău specific, dacă e necesar
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variabila globală pentru token
auth_token = None
backend_url = "http://localhost:3000"  # URL complet către backend


@app.get("/", response_class=HTMLResponse)
async def read_root():
    file_path = os.path.join(os.getcwd(), "interfata.html")
    with open(file_path, "r") as file:
        return HTMLResponse(content=file.read())

@app.get("/templates", response_class=HTMLResponse)
async def user_orders():
    file_path = os.path.join(os.getcwd(), "templates/templates.html")
    with open(file_path, "r") as file:
        return HTMLResponse(content=file.read())

@app.get("/services", response_class=HTMLResponse)
async def user_orders():
    file_path = os.path.join(os.getcwd(), "services/services.html")
    with open(file_path, "r") as file:
        return HTMLResponse(content=file.read())


@app.get("/user-orders", response_class=HTMLResponse)
async def user_orders():
    file_path = os.path.join(os.getcwd(), "user-orders/user_orders.html")
    with open(file_path, "r") as file:
        return HTMLResponse(content=file.read())

    @app.get("/admin-orders", response_class=HTMLResponse)
    async def user_orders():
        file_path = os.path.join(os.getcwd(), "admin-orders/admin_orders.html")
        with open(file_path, "r") as file:
            return HTMLResponse(content=file.read())


@app.post("/register")
async def register(username: str, password: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{backend_url}/register", json={"username": username, "password": password})
    if response.status_code == 201:
        return {"message": "Registration successful"}
    raise HTTPException(status_code=response.status_code, detail=response.json().get("message", "Registration failed"))


@app.post("/login")
async def login(username: str, password: str):
    global auth_token
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{backend_url}/login", json={"username": username, "password": password})
    if response.status_code == 200:
        auth_token = response.json().get("token")
        return {"message": "Login successful", "token": auth_token}
    raise HTTPException(status_code=response.status_code, detail=response.json().get("message", "Login failed"))


@app.post("/orders")
async def create_order(numberOfTrucks: int, numberOfPallets: int, weightInTons: int, route: int):
    global auth_token
    if not auth_token:
        raise HTTPException(status_code=401, detail="Trebuie să fii autentificat")
    headers = {"Authorization": f"Bearer {auth_token}"}
    order_data = {
        "numberOfTrucks": numberOfTrucks,
        "numberOfPallets": numberOfPallets,
        "weightInTons": weightInTons,
        "route": route
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{backend_url}/orders", json=order_data, headers=headers)

    if response.status_code == 201:
        return response.json()
    raise HTTPException(status_code=response.status_code, detail="Eroare la crearea comenzii")


@app.get("/orders")
async def get_orders():
    global auth_token
    if not auth_token:
        raise HTTPException(status_code=401, detail="Trebuie să fii autentificat")
    headers = {"Authorization": f"Bearer {auth_token}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{backend_url}/orders", headers=headers)

    if response.status_code == 200:
        return response.json()
    raise HTTPException(status_code=response.status_code, detail="Eroare la obținerea comenzilor")
