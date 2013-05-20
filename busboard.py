import MySQLdb
import peewee
import datetime
from flask import Flask, request, session, g, redirect, url_for, \
    abort, render_template, flash

# BUSBOARD_SETTINGS = 'busboard_config.py'
#Create the app
app = Flask(__name__)
app.config.from_object('busboard_config')

# Now that we've got config, get models
from Models import Member, Route, Stop, HotStop, database

database.init(app.config['DATABASE'], user=app.config['USERNAME'],
              passwd=app.config['PASSWORD'])
database.connect()


def create_tables():
    Member.create_table()
    Route.create_table()
    Stop.create_table()
    HotStop.create_table()


if not Member.table_exists():
    create_tables()


@app.before_request
def before_request():
    g.db = database
    g.db.connect()


@app.after_request
def after_request(response):
    g.db.close()
    return response


def member_login(request):
    member = Member.get(Member.username == requset.form['username'])
    return member.username


@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('logged_in'):
        return redirect(url_for('hotstops'))

    error = None

    if request.method == 'POST':
        member = member_login(request)
    return render_template('login.html', error=error)


@app.route('/member', methods=['GET', 'POST', 'PUT', 'DELETE'])
def update_member():
    if request.method == 'POST':
        # Is this seat taken?
        existing_member = Member.get(
            Member.username == request.forms['username'])

        if not existing_member:
            #Create a new member
            new_member = Member()
            for field, value in request.form.items():
                setattr(new_member, field, value)
            new_member.save()
            flash('Welcome to the party, ' + new_member.username)
            return render_template('login.html')
    elif request.method == 'GET':
        return render_template('member.html')




#@app.route('/hotstops')

if __name__ == '__main__':
    app.run()
