from sqlalchemy import create_engine

engine = create_engine('postgresql+psycopg2://user:password@localhost/dbname')

print('connected')