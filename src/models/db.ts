import mongoose from 'mongoose';
let uri = '';

if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI) {
    uri = process.env.MONGODB_URI;
}else if(process.env.MONGODB_URI){
    uri = process.env.MONGODB_URI;
}

if(uri){
    mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false });
}


mongoose.connection.on('connected', () => {
    console.log("======================");
    console.log("======================");
    console.log(`Mongoose connected to ${uri}`);
    console.log("======================");
    console.log("======================");
});

mongoose.connection.on('error', err => {
    console.log(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});


const shutdown = (msg: string, callback: mongoose.HookNextFunction) => {
    mongoose.connection.close( () => {
        console.log(`Mongoose disconnected through ${msg}`);
        callback();
    });
};



process.once('SIGUSR2', () => {
    shutdown('nodemon restart', () => {
        process.kill(process.pid, 'SIGUSR2');
    });
});


process.on('SIGINT', () => {
    shutdown('app termination', () => {
        process.exit(0);
    });
});


process.on('SIGTERM', () => {
    shutdown('Heroku app shutdown', () => {
        process.exit(0);
    });
});

import './message.model';
import './user.model';