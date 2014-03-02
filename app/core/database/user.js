var mongoose = require('mongoose')
  , models = require('../../models')
  , Paths = mongoose.model('Paths')
  , Users = mongoose.model('Users')
  , _ = require('underscore')
  , async = require('async');

var db = {};

db.files = require('./files');
db.paths = require('./paths');

var user = {
  exists : function(username, cb) {
    Users.count({username : username}, function(err, count) {
      if(count)
        cb(true);
      else
        cb(false);
    });
  },
  byUsername : function(username, done) {
    Users.findOne({username : username}, done);
  },
  byId : function(uid, done) {
    Users.findById(uid, done);
  },
  setClient: function(username, client, done) {
    Users.findOneAndUpdate({username: username}, {client: client}, done);
  },
  setSpaceLeft: function(id, left, done) {
    Users.findByIdAndUpdate(id, {spaceLeft: left}, done);
  },
  //Reset user database
  reset : function(uid, done) {
    db.files.byUser(uid, 0, {}, function(err, docs) {
      
      var albums = [], movies = [], others = [];

      _.each(docs.paths, function(el){
        _.each(el.albums, function(a) { albums.push(a); });
        _.each(el.movies, function(a) { movies.push(a); });
        _.each(el.others, function(a) { others.push(a); });
      });

      async.parallel({
          albums: function(callback){
            async.each(albums, 
              function(album, cb) {
                db.files.albums.delete(album._id, cb);
              }, 
              function(err){
                callback(err);
              }
            );
          },
          movies: function(callback){
            async.each(movies, 
              function(movie, cb) {
                db.files.movies.delete(movie._id, cb);
              }, 
              function(err){
                callback(err);
              }
            );
          },
          others: function(callback) {
            async.each(others, 
              function(other, cb) {
                db.files.others.delete(other._id, cb);
              }, 
              function(err){
                callback(err);
              }
            );
          }
      },
      function(err, results) {

          db.paths.byUser(uid, function(err, map) {
            async.each(
              map.docs.paths, 
              function(path,callback){
                //Deleting each file id, previously saved inside the path object
                Paths.findByIdAndUpdate(path._id, {others : [], movies: [], albums: []}, function(err) {
                  callback(err);
                });
              }, 
              function(err){
                done(err);
              }
            );

          });
      });

    });
  }
};

module.exports = user;