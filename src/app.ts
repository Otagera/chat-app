//To  make sure any property i add to response or request would be recognized
declare module 'express-serve-static-core' {
	interface Response {
		statusJson: (statusCode: number, data: {})=>void
	}
}

import { Express } from 'express-serve-static-core';
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import * as http from 'http';
import * as socketio from 'socket.io';
import { RegisterInfo, Usernames, OnlineInfo } from './interfaces';

dotenv.config();

const app: Express = express();

/**
 * Create HTTP server.
 */
const server: http.Server = http.createServer(app);

export const io: socketio.Server = new socketio.Server();
io.attach(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use((req: Request, res: Response, next: NextFunction)=>{
	res.statusJson = (statusCode: number, data: {}): void=>{
		let obj = {
			...data,
			statusCode: statusCode
		}
		res.status(statusCode).json(obj);
		return;
	};
	next();
});

import { AppRouter } from './AppRouter';
app.use(AppRouter.getInstance());

import './models/db';
import './controllers/RootController';
import './controllers/APIController';
import './controllers/AuthController';

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction)=>{
  next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction)=>{
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//map having my sockets id maps to the names of users involved in that conversation.
export const sids = new Map<string, Usernames>();
//io related issues
io.on('connection', (socket: socketio.Socket)=>{
  let onlineStatus: OnlineInfo;
	console.log('connection', socket.id);
	socket.emit('status', { id: socket.id });

  socket.on('registerId', (info: RegisterInfo)=>{
    //with this operation, it deletes every other instance of conversaion between this two persons,
    //its don so that the map doesnt get crowded if the user keeps creating different instances (tabs, devices)
    //but of course i could try to change it and allow 2 instance only, so it doesnt get crowded.
    sids.forEach((usernames: Usernames, id: string)=>{
      if(usernames.receiver === info.usernames.receiver && usernames.sender === info.usernames.sender){
        sids.delete(id);
      }
    });
    sids.set(info.socketId, info.usernames);
    onlineStatus = { 
      username: info.usernames.sender,
      online: true
    };
    
    io.emit('online', onlineStatus);
  });

	socket.on('disconnect', ()=>{
		console.log('Disconnect', socket.id);
    const usernames = sids.get(socket.id);
    if(usernames){
      onlineStatus = {
        username: usernames.sender,
        online: false
      };
  		io.emit('online', onlineStatus);
    }
    sids.delete(socket.id);
	});
});
/*
  //io
  export const sids = new Map<string, string>();
  io.on('connection', (socket: socketio.Socket)=>{
    let onlineStatus: SendOnline;
    console.log('connection', socket.id);
    socket.emit('status', { id: socket.id });

    socket.on('registerId', (info: SendInfo)=>{
      sids.set(info.username, info.id);
      onlineStatus = { 
        username: info.username,
        online: true
      };
      console.log(sids);
      io.emit('online', onlineStatus);
    });

    socket.on('disconnect', ()=>{
      console.log('Disconnect', socket.id);
      sids.forEach((value: string, key: string)=>{
        console.log(value, key);
        if(value === socket.id){
          onlineStatus = {
            username: key,
            online: false
          };
          io.emit('online', onlineStatus);
        }
      });
    });
  });
 */

/**
 * Module dependencies.
 */

var debug = require('debug')('chatapp:server');

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000');


app.set('port', port);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: any) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : (addr)? 'port ' + addr.port: '';
  debug('Listening on ' + bind);
  console.log("=============");
  console.log("=============");
  console.log("App is listening from port: " + port);
}
