app.service('Game', Game);

function Game(UserState, FirebaseRef, $firebaseAuth, $firebaseArray, Error, $state, $rootScope, Mobile){
  var self = this,
      currentPlayerIndex = 0,
      currentQuestionIndex = 0;

  this.ref = null;
  this.inProgress = false;
  this.numOfPlayers = 0;
  this.id = '...';
  this.playerOrder = [];
  this.time = 9;

  this.createNew = function(){
    var id = generateGameCode();

    FirebaseRef.child('Games').child(id).once('value', function(snapshot) {
        if (snapshot.val() === null) addToFirebase(id);
        else self.createGame();
    });

    function addToFirebase(id){
        self.id = id;
        self.ref = FirebaseRef.child('Games').child(id);
        self.ref.set({numOfPlayers: self.numOfPlayers, inProgress: self.inProgress, time: self.time});

        $firebaseAuth(FirebaseRef).$authAnonymously().then(function(authData) {
              console.log("Logged in as:", authData.uid);
              self.ref.onDisconnect().remove();
            }, {remember: "sessionOnly"})
             .catch(function(error) {
              console.error("Authentication failed:", error);
              Error.message = "Could not create game. Please refresh the page to try again.";
              if(!$rootScope.$$phase) $rootScope.$apply();
        });

        self.ref.on('value', function(snapshot){
              var update = checkPlayers(snapshot.val().players);
              self.numOfPlayers = update.numOfPlayers;
              self.inProgress = update.inProgress;
              self.playerOrder = update.playerOrder;
              self.players = snapshot.val().players;
          
              self.ref.update(update);
              if(update.inProgress) {self.ref.off('value'); setupGame();}
              if(!$rootScope.$$phase) $rootScope.$apply();
        });
      }

  };

  this.connectTo = function(id){
    FirebaseRef.child('Games').child(id).once('value', function(snapshot) {
          var exists = (snapshot.val() !== null);
          if (!exists) {Error.message = "Game could not be found. Check your ID.";  if(!$rootScope.$$phase) {$rootScope.$apply();} return; }

          Error.message = '';
          self.ref = FirebaseRef.child('Games').child(id);
          self.id = id;
          self.inProgress = snapshot.val().inProgress;
          self.numOfPlayers = snapshot.val().numOfPlayers;
          UserState.state = 'connected';

          self.ref.on('value', function(snapshot){
              setGameParameters(snapshot.val());
              if(self.inProgress) {self.ref.off('value'); startGame();}
          });

          if(!$rootScope.$$phase) $rootScope.$apply();
    });
  }

  this.nextQuestion = function(){
    if(Mobile) return;
    /*self.questions[currentQuestionIndex] = self.currentQuestion;
    self.ref.update({questions: self.questions});*/
    
      resetTimer();
      resetAnswers(self.players);

      currentPlayerIndex = currentPlayerIndex == (self.numOfPlayers - 1) ? 0 : currentPlayerIndex + 1;
      currentQuestionIndex++;

      if(currentQuestionIndex == self.questions.length) { endGame(); return;}
      self.currentQuestion = self.questions[currentQuestionIndex];
      setCurrentPlayer(self.playerOrder[currentPlayerIndex]);

      self.ref.update({currentQuestion: self.currentQuestion});
    
  }

  this.setCurrentQuestionAnswer = function(answer){
    self.ref.child('currentQuestion').update({selectedAnswer: answer});
  }
  
  this.timerTick = function(end){
    end = end || false;
    self.time = end? 0 : self.time - 1;
    self.ref.update({time: self.time});
  }
  
  function resetTimer(){
    self.time = 9;
    self.ref.update({time: 9});    
  }
  
  function setCurrentPlayer(id){
       self.ref.child('players').once('value', function(snapshot) {
          self.currentPlayer = snapshot.val()[id];
          self.ref.update({currentPlayer: self.currentPlayer});
       });
  }

  function setupGame(){
    FirebaseRef.child('Questions').once('value', function(snapshot) {
        self.questions = shuffleArray(snapshot.val()).splice(5);

        self.playerOrder = shuffleArray(self.playerOrder);

        self.currentQuestion = self.questions[currentQuestionIndex];

        setCurrentPlayer(self.playerOrder[currentPlayerIndex]);

        self.ref.update({playerOrder: self.playerOrder, questions: self.questions, currentQuestion : self.currentQuestion});

        startGame();
    });
  }

  function startGame(){
    self.ref.on('value', function(snapshot){
       setGameParameters(snapshot.val());
       if(self.time === 0 && $state.is('guess-answer')) $state.go('display-answer');
       if(!$rootScope.$$phase) $rootScope.$apply();
    });
    self.ref.child('players').on('value', function(snapshot){
        if(snapshot.val() === null) return;
        var answers = correctAnswers(snapshot.val());
        self.ref.child('currentQuestion').update(answers);
    });
    self.ref.child('currentQuestion').on('value', function (snapshot){
      if(snapshot.val()) self.selectedAnswer = snapshot.val().selectedAnswer;
      if(self.selectedAnswer && $state.is('set-answer')) $state.go('guess-answer');
    });
    $state.go('set-answer');
  }

  function endGame(){
    $state.go('result');
  }

  function setGameParameters(snapshotVal){
    self.inProgress = snapshotVal.inProgress;
    self.players = snapshotVal.players;
    self.playerOrder = snapshotVal.playerOrder;
    self.numOfPlayers = snapshotVal.numOfPlayers;
    self.currentPlayer = snapshotVal.currentPlayer;
    self.questions = snapshotVal.questions;
    self.currentQuestion = snapshotVal.currentQuestion;
    self.time = snapshotVal.time;
  }

  function checkPlayers(players){
      var size = 0, ready = [], play = false, order = [];

      for (key in players) {
         if (players.hasOwnProperty(key)) size++;
         order.push(players[key].id);
         ready.push(players[key].ready);
      }
      if(ready.indexOf(false) === -1 && ready.length && self.numOfPlayers > 1) play = true;
      return {numOfPlayers: size, inProgress: play, playerOrder: order};
  }
  
  function correctAnswers(players){
    var correct = [], wrong = [];
    for (key in players) {
         if(players[key].answer && players[key].answer == self.currentQuestion.selectedAnswer){
            correct.push({answer: players[key].answer, name: players[key].name, color: players[key].color, avatar: players[key].avatar});
         }
        else if(players[key].answer){
            wrong.push({answer: players[key].answer, name: players[key].name, color: players[key].color, avatar: players[key].avatar});
        }
    }
    return {answers:{correct:correct, wrong:wrong, total:(correct.length + wrong.length)}};
  }
  
  function resetAnswers(players){
    for (key in players) {
         if(players[key].answer){
            players[key].answer = {};
         }
    }
    self.ref.child('players').update(players);
  }
  
  function generateGameCode(){
      var finalCode = [],
          possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for(var i = 0; i < 6; i++){
        finalCode.push(possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)));
      }
      return finalCode.join('');
  }

  function shuffleArray(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

}
