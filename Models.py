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

    def available_directions(self):
        directions = Direction.select().dicts()\
            .join(RouteDirectionAssociation)\
            .where(RouteDirectionAssociation.route == self)

        return directions


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
    route = ForeignKeyField(Route, related_name='hs_route')
    direction = ForeignKeyField(Direction, related_name='hs_direction')
    stop = ForeignKeyField(Stop, related_name='hs_stop')
    added_on = DateTimeField()
    updated = DateTimeField(default=datetime.datetime.now)
    dashboard = BooleanField(default=True)

    def to_display_dict(self):
        return {
            'direction_id': self.direction.id,
            'direction_name': self.direction.text,
            'id': self.id,
            'member_id': self.member.id,
            'route_description': self.route.description,
            'route_id': self.route.id,
            'route_number': self.route.route,
            'stop_id': self.stop.id,
            'stop_name': self.stop.name,
        }
