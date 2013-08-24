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

    def to_display_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'abbr': self.abbr
        }


class Route(BaseModel):
    # Number has to be char; routes have letters
    route = CharField()
    description = CharField()
    providerid = CharField()
    updated = DateTimeField(default=datetime.datetime.now)

    def available_directions(self):
        directions = Direction.select().dicts()\
            .join(RouteDirectionAssociation)\
            .where(RouteDirectionAssociation.route == self)

        return directions

    def to_display_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'number': self.route
        }


class Direction(BaseModel):
    value = IntegerField()
    text = CharField()

    def to_display_dict(self):
        return {
            'id': self.id,
            'name': self.text,
            'value': self.value
        }


class RouteStopAssociation(BaseModel):
    route = ForeignKeyField(Route, related_name='r_route')
    stop = ForeignKeyField(Stop, related_name='r_stop')


class RouteDirectionAssociation(BaseModel):
    route = ForeignKeyField(Route, related_name='d_route')
    direction = ForeignKeyField(Direction, related_name='d_direction')


class HotStop(BaseModel):
    member = ForeignKeyField(Member, related_name='hotstops')
    route = ForeignKeyField(Route, related_name='hs_route')
    direction = ForeignKeyField(Direction, related_name='hs_direction')
    stop = ForeignKeyField(Stop, related_name='hs_stop')
    added_on = DateTimeField()
    updated = DateTimeField(default=datetime.datetime.now)
    dashboard = BooleanField(default=True)

    def to_display_dict(self):
        return {
            'direction': self.direction.to_display_dict(),
            'id': self.id,
            'route': self.route.to_display_dict(),
            'stop': self.stop.to_display_dict(),
        }
