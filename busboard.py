import time
from flask import Flask, request, session, g, redirect, url_for, \
    render_template, flash
import requests as outbound
import xml.etree.ElementTree as ET


#Create the app
app = Flask(__name__)
app.config.from_object('busboard_config')

# Now that we've got config, get models
from Models import Member, Route, Stop, HotStop, RouteStopAssociation, \
    Direction, RouteDirectionAssociation, database

database.init(app.config['DATABASE'], user=app.config['USERNAME'],
              passwd=app.config['PASSWORD'])
database.connect()


def create_tables():
    Member.create_table()
    Route.create_table()
    Stop.create_table()
    HotStop.create_table()
    RouteStopAssociation.create_table()


def build_nextrip_routes():

    url = app.config['NEXTRIP_BASE_URL'] + 'Routes'
    response = outbound.get(url)
    root = ET.fromstring(response.text)

    for nt_route in root:
        Route.create(providerid=nt_route.findtext(app.config['NEXTRIP_XML_PREFIX'] + 'ProviderID'),
                     route=nt_route.findtext(app.config['NEXTRIP_XML_PREFIX'] + 'Route'),
                     description=nt_route.findtext(app.config['NEXTRIP_XML_PREFIX'] + 'Description'))

    return response.text


@app.route('/build_stops')
def build_stops_for_routes():
    routes = Route.select()
    for route in routes:
        rda = RouteDirectionAssociation.select().where(RouteDirectionAssociation.route == route)
        url = app.config['NEXTRIP_BASE_URL'] + 'Stops/' + route.route + '/' + str(rda[0].direction.value)
        print url
        # Get the stops
        stop_response = outbound.get(url)
        xml = ET.fromstring(stop_response.text)
        for child in xml:
            abbr = child.findtext(app.config['NEXTRIP_XML_PREFIX'] + 'Value')
            name = child.findtext(app.config['NEXTRIP_XML_PREFIX'] + 'Text')
            print name
            print abbr

            try:
                stop = Stop.get(Stop.abbr == abbr)
            except Stop.DoesNotExist:
                stop = Stop.create(abbr=abbr, name=name)

            RouteStopAssociation.create(route=route, stop=stop)

    return 'Yay!'


@app.route('/build_directions')
def build_directions_for_routes():
    routes = Route.select()
    for route in routes:
        url = app.config['NEXTRIP_BASE_URL'] + 'Directions/' + route.route
        d_response = outbound.get(url)
        xml = ET.fromstring(d_response.text)
        for child in xml:
            value = child.findtext(app.config['NEXTRIP_XML_PREFIX'] + 'Value')
            direction = Direction.get(Direction.value == value)
            RouteDirectionAssociation.create(route=route, direction=direction)


if not Member.table_exists():
    create_tables()


def get_template_vars():
    return g.template_vars


@app.before_request
def before_request():
    g.db = database
    g.db.connect()

    g.template_vars = {'logged_in': False}
    if session.get('member_id'):
        g.template_vars['logged_in'] = True


@app.after_request
def after_request(response):
    g.db.close()
    return response


def get_member_from_credentials(form):
    try:
        member = Member.get(Member.username == form['username']
                            & Member.password == form['password'])
        return member
    except Member.DoesNotExist:
        return False


@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('member_id'):
        return redirect(url_for('show_hotstops'))

    message = 'Welcom to HotStop!'
    if request.method == 'POST':
        member = get_member_from_credentials(request.form)

        if member:
            session['member_id'] = member.id
            message = 'Welcome back, ' + member.username
            flash(message)
            redirect(url_for('show_hotstops'))

        else:
            message = 'We could not find an account with those credentials.'

    flash(message)
    return render_template('login.html', vars=get_template_vars())


@app.route('/member', methods=['GET', 'POST', 'PUT', 'DELETE'])
def update_member():
    if request.method == 'POST':
        # Is this seat taken?
        try:
            member = Member.get(
                Member.username == request.form['username'])
            message = "The username '" + member.username + \
                "' is already in use."
            destination = 'member'
        #Create a new member
        except Member.DoesNotExist:
            new_member = Member()
            for field, value in request.form.items():
                setattr(new_member, field, value)
            new_member.save()
            message = 'Welcome to the party, ' + new_member.username
            destination = 'login'
        flash(message)
        return redirect(url_for(destination))

    elif request.method == 'GET':
        return render_template('member.html', vars=g.template_vars)


@app.route('/hotstops', methods=['GET', 'PUT', 'POST', 'DELETE'])
def show_hotstops():

    # No riff-raff
    if not session.get('member_id'):
        return redirect(url_for('login'))

    # Show the goods
    if request.method == 'GET':
        print session.get('member_id')
        hotstops = HotStop.select().where(
            HotStop.member == session.get('member_id'))

    elif request.method == 'POST':

        # Add a HotStop for the logged-in member
        new_hs = HotStop()
        new_hs.member = Member.get(Member.id == session.get('member_id'))

        for field, value in request.form.items():
            setattr(new_hs, field, value)

        new_hs.save()

        return redirect(url_for('show_hotstops'))

    else:
        # Update and delete, hmmm?
        pass

    g.template_vars['title'] = 'HotStops'
    g.template_vars['hotstops'] = hotstops
    return render_template('hotstops.html', vars=get_template_vars())


@app.route('/routes')
def routes():
    routes = get_nextrip_routes()
    return routes


@app.route('/logout')
def logout():
    session.pop('member_id', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run()
