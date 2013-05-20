from peewee import *
import datetime

database = MySQLDatabase(None)


class BaseModel(Model):
    class Meta():
        database = database


class Member(BaseModel):
    username = CharField()
    email = CharField()
    password = CharField()
    date_added = DateTimeField(default=datetime.datetime.now)


class Stop(BaseModel):
    abbr = CharField()
    name = CharField()
    updated = DateTimeField(default=datetime.datetime.now)


class Route(BaseModel):
    # Number has to be char; routes have letters
    number = CharField()
    name = CharField()
    updated = DateTimeField(default=datetime.datetime.now)


class HotStop(BaseModel):
    member = ForeignKeyField(Member, related_name='hotstops')
    route = ForeignKeyField(Route)
    stop = ForeignKeyField(Stop)
    added_on = DateTimeField()
    updated = DateTimeField(default=datetime.datetime.now)
    direction = IntegerField()
    dashboard = BooleanField(default=True)
