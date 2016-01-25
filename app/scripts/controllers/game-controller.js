app.controller('GameController', GameController)

function GameController($scope, $interval, Mobile, $state, $timeout, Game, CurrentUser){
    $scope.onMobile = Mobile;
    $scope.game = Game;
    $scope.user = CurrentUser;
  
        //Timer funktion
        if($state.is('guess-answer')) {
            //$scope.count = 7;
            if(!Mobile) var counter = $interval(timer, 1000); // kör varje sekund

            function timer() {
                Game.timerTick();
                //$scope.count = $scope.count - 1;
                if (Game.time <= 0 || (Game.numOfPlayers - 1) == Game.currentQuestion.answers.total) {
                    $interval.cancel(counter);
                    Game.timerTick(true);
                    return;
                }
            }
        }

        if($state.is('display-answer')) {
            if(CurrentUser.answer === Game.currentQuestion.selectedAnswer && CurrentUser.id !== Game.currentPlayer.id){
                CurrentUser.addScore(1);
            }
            else if(CurrentUser.id === Game.currentPlayer.id && Game.currentQuestion.answers.correct){
                CurrentUser.addScore(1);
            }
            
            var time = $timeout(function () {
                Game.nextQuestion();
                $state.go('set-answer');
                $timeout.cancel(time);
            }, 10000);
        }


        $scope.chooseAnswer = function (answer) {
            $scope.chosenAnswer = answer;
            if(Mobile) CurrentUser.chooseAnswer(answer);
        }

        $scope.setAnswer = function (answer){
            Game.setCurrentQuestionAnswer(answer);          
        }
}
