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
    abbr = CharField(unique=True)
    name = CharField()
    updated = DateTimeField(default=datetime.datetime.now)


class Route(BaseModel):
    # Number has to be char; routes have letters
    route = CharField()
    description = CharField()
    providerid = CharField()
    updated = DateTimeField(default=datetime.datetime.now)


class Direction(BaseModel):
    value = IntegerField()
    text = CharField()


class RouteStopAssociation(BaseModel):
    route = ForeignKeyField(Route, related_name='r_route')
    stop = ForeignKeyField(Stop, related_name='r_stop')


class RouteDirectionAssociation(BaseModel):
    route = ForeignKeyField(Route, related_name='d_route')
    direction = ForeignKeyField(Direction, related_name='d_direction')


class HotStop(BaseModel):
    member = ForeignKeyField(Member, related_name='hotstops')
    route = CharField()
    stop = CharField()
    added_on = DateTimeField()
    updated = DateTimeField(default=datetime.datetime.now)
    direction = IntegerField()
    dashboard = BooleanField(default=True)
