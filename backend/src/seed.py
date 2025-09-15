import bcrypt
from .database import SessionLocal, engine, Base
from .models import User, GenderEnum

db = SessionLocal()

print("--- Creating database tables ---")
Base.metadata.create_all(bind=engine)
print("Tables created successfully.")

print("\n--- Seeding database with demo user ---")
demo_user = db.query(User).filter(User.username == "demo").first()

if demo_user:
    print("Demo user already exists.")
else:
    password = "Demo1234"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    new_user = User(
        username="demo",
        name="Demo User",
        age=30,
        gender=GenderEnum.na,
        phone="+11234567890",
        password_hash=hashed_password.decode('utf-8')
    )
    db.add(new_user)
    db.commit()
    print("Successfully seeded demo user.")

db.close()