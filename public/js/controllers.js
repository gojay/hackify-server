'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, socket, serverState) {
    $scope.name = serverState.roomName;

    $scope.currentFile = "no file";
    $scope.files = [];
    $scope.body = "";
    $scope.messages = [];
    $scope.users = [];
    $scope.readOnly = true;
    $scope.warning = "";

    $scope.newMessage = "";
    $scope.newUserId = "";
    $scope.newChange = null;

    socket.emit('joinRoom', {room: serverState.roomName});

    //***************************
    //***** Socket recievers ****
    //***************************

    //server --> client (notification that the active file has changed, data comes later)
    socket.on('changeCurrentFile', function (file) {
      $scope.currentFile = file;
    });

    socket.on('roomReadOnly', function (readOnly) {
      $scope.readOnly = readOnly;
    });

    socket.on('fileAdded', function(file){
      $scope.files.push(file);
    });

    socket.on('fileDeleted', function(file){
      $scope.files.splice($scope.files.indexOf(file), 1);
    });

    socket.on('fileChanged', function(file){
      //TODO - maybe do something with times... mebe push the last updated time from host and use on UI to 'red' the recently altered.. or order.. not sure
    });

    //server --> client (server sends fresh data for active file)
    socket.on('refreshData', function (body) {
      if(body){
        $scope.body = body;
      }else{
        $scope.body = '';
      }
    });

    //server --> client (recieve an incremental operation from the active editor via the server)
    socket.on('changeData', function (data) {
      $scope.newChange = data;
    });

    socket.on('resetHostData', function(){
      $scope.currentFile = "no file";
      $scope.files = [];
      $scope.body = "";
      $scope.warning = "";
    });

    socket.on('newChatMessage', function (message, userId) {
      $scope.messages.push({message:message, userId:userId});
    });

    socket.on('newUser', function(data){
      $scope.users.push(data); 
    });

    socket.on('exitingUser', function(userId){
      var user = findUser(userId);
      $scope.users.splice($scope.users.indexOf(user), 1);       
    });    

    socket.on('userIdChanged', function(oldUserId, newUserId){
      var user = findUser(oldUserId);
      if(user)
        user.userId = newUserId;      
    });

    var findUser = function(userId){
      var foundUser = null;
      $scope.users.forEach(function(user){
        if(user.userId===userId){
          foundUser = user;
        }
      });
      return foundUser;
    };

    //***************************
    //**** make stuff happen ****
    //***************************

    $scope.requestChangeCurrentFile = function(file){
      socket.emit('changeCurrentFile', file);
    };

    $scope.requestSaveCurrentFile = function(){
      socket.emit('saveCurrentFile');
    };    

    $scope.newChatMessage = function(){
      socket.emit('newChatMessage', $scope.newMessage);
      $scope.newMessage = "";
    };

    $scope.changeUserId = function(){
      socket.emit('changeUserId', $scope.newUserId);
      $scope.newUserId = "";
    };

    //***************************
    //**set up the code editor***
    //***************************

    $scope.onEditorChange = function(i, op){
      if(op.origin!=='setValue'){
        if($scope.readOnly){
          $scope.warning = "Your changes will not be shared";
        }else{
          console.log('editor change:' + op);
          socket.emit('changeData', op);
          socket.emit('refreshData', $scope.body, false);//refresh data on server but don't broadcast
        }
      }
    };

    $scope.editorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        readOnly: false,
        mode: 'js',
        onChange: $scope.onEditorChange
    };

  });




