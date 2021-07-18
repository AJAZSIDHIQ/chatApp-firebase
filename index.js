
firebase.initializeApp(firebaseConfig);

var currentUid = null;  
 var database = firebase.database();

var userRef = database.ref('users');

var currentUserRef = null
var isCurrentUserOnline = null

var currentChatRef = null
var currentchatid = null
var chatuserid = null;
var chatusername = null;



 firebase.auth().onAuthStateChanged(function(user) {  
  // onAuthStateChanged listener triggers every time the user ID token changes.  
  // This could happen when a new user signs in or signs out.  
  // It could also happen when the current user ID token expires and is refreshed.  
  if (user && user.uid != currentUid) {  
   // Update the UI when a new user signs in.  
   // Otherwise ignore if this is a token refresh.  
   // Update the current user UID.  
   currentUid = user.uid;  

   currentUserRef = firebase.database().ref('users/' + user.uid)

   currentUserRef.set({
    username: user.displayName,
    email: user.email,
    isOnline : true
  });

  isCurrentUserOnline = true

   //document.body.innerHTML = user.displayName
  } else {  
   // Sign out operation. Reset the current user UID. 
   makeOffline() 
   currentUid = null;  
   console.log("no user signed in");  
   location.href = 'login/index.html';
  }  
 });  



function clickforChat(chatuserId){
    document.getElementById("info-panel").style.display= "none"
    document.getElementById("right-panel").style.display= "block"
    database.ref().child("users").child(chatuserId).get().then((snapshot) => {
        if (snapshot.exists()) {
            //console.log(snapshot.val());
            chatusername = snapshot.val().username
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
    var chatid = "" 
    if(currentUid < chatuserId) 
        chatid = currentUid + chatuserId
    else 
        chatid = chatuserId + currentUid

    if(currentchatid == chatid)
        return;

    currentchatid = chatid
    currentChatRef = database.ref('chats/' + chatid );

    let htmlContent =""



    currentChatRef.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            var msgJson = childSnapshot.val();
            // ...
            if(msgJson.sender == currentUid){
                htmlContent += "<div id='chat-"+childSnapshot.key+"' class='container'><p><b> ME </b>: "+msgJson.msg+"</p><span class='time-right'>"+ new Date(msgJson.timestamp * 1000).toLocaleString()+"</span>"

                if(msgJson.seenAt) {
                    htmlContent += "<span class='time-left' title='seen at : "+new Date(msgJson.seenAt * 1000).toLocaleString() +" \n delivered at : "+ new Date(msgJson.deliveredAt * 1000).toLocaleString()+"'>seen</span>"
                }
                else if (msgJson.deliveredAt){
                    htmlContent += "<span class='time-left' title='delivered at : "+ new Date(msgJson.deliveredAt * 1000).toLocaleString()+"'>delivered</span>"
                }
            }

            else{
                htmlContent += "<div id='chat-"+childSnapshot.key+"' class='container darker'><p><b> "+chatusername+"</b> : "+msgJson.msg+"</p><span class='time-left'>"+ new Date(msgJson.timestamp * 1000).toUTCString()+"</span>"

            }

            htmlContent +=  "</div>"

            if(msgJson.sender != currentUid  && !msgJson.seenAt){
                let updateJson ={}
                if(!msgJson.deliveredAt)
                    updateJson.deliveredAt = firebase.database.ServerValue.TIMESTAMP
                updateJson.seenAt = firebase.database.ServerValue.TIMESTAMP
                currentChatRef.child(childSnapshot.key).update(updateJson);
            }

        });

        document.getElementById("message-container").innerHTML =htmlContent

        window.scrollTo(0,document.body.scrollHeight);
    });

    currentChatRef.on('child_added', (data) => {
        var msgJson = data.val();
            // ...
        let el = document.createElement('div');
        if(!document.getElementById("chat-" + data.key)){
            if(msgJson.sender == currentUid){
                el.innerHTML = "<div id='chat-"+data.key+"'  class='container'><p><b> ME </b>: "+msgJson.msg+"</p><span class='time-right'>"+ new Date(msgJson.timestamp * 1000).toUTCString()+"</span></div>"
            }
    
            else{
                el.innerHTML = "<div id='chat-"+data.key+"' class='container darker'><p><b> "+chatusername+"</b> : "+msgJson.msg+"</p><span class='time-left'>"+ new Date(msgJson.timestamp * 1000).toUTCString()+"</span></div>"
            }
            document.getElementById("message-container").append(el)
        }


        window.scrollTo(0,document.body.scrollHeight);

        if(msgJson.sender != currentUid  && !msgJson.seenAt){
            let updateJson ={}
            if(!msgJson.deliveredAt)
                updateJson.deliveredAt = firebase.database.ServerValue.TIMESTAMP
            updateJson.seenAt = firebase.database.ServerValue.TIMESTAMP
            currentChatRef.child(data.key).update(updateJson);
        }
    });

    currentChatRef.on('child_changed', (data) => {
        var msgJson = data.val();
            // ...
        let el = document.getElementById('chat-'+data.key);
        if(el && msgJson.sender == currentUid && !(el.childElementCount>2) && (msgJson.seenAt || msgJson.deliveredAt)) {
            let temp = document.createElement('div');
            if(msgJson.seenAt) {
                temp.innerHTML = "<span class='time-left' title='seen at : "+new Date(msgJson.seenAt * 1000).toLocaleString() +" \n delivered at : "+ new Date(msgJson.deliveredAt * 1000).toLocaleString()+"'>seen</span>"
            }
            else if (msgJson.deliveredAt){
                temp.innerHTML = "<span class='time-left' title='delivered at : "+ new Date(msgJson.deliveredAt * 1000).toLocaleString()+"'>delivered</span>"
            }
            el.append(temp)
        }

    });
}

 function sendmsg() {
     let inputelem = document.getElementById("message-input")
     let inputmsg =  inputelem.value
     console.log(inputmsg)

     var newMsg = currentChatRef.push();
     newMsg.set({
            msg : inputmsg,
            sender : currentUid,
            timestamp : firebase.database.ServerValue.TIMESTAMP,
            deliveredTimestamp : null,
            readTimestamp : null,
        });
    inputelem.value = ''
 }

 userRef.once('value', (snapshot) => {
        console.log(snapshot.val());
        let users = snapshot.val()
        let htmlContent = ""
        for (const key in users) {
            if(key == currentUid)
                continue;

            let isOnline = "offline"
            if(users[key].isOnline == true)
                isOnline = "online"

            //console.log(`${key}: ${user[key]}`);
            htmlContent += "<li id='user-"+key +"' class='w3-bar' onclick=\"clickforChat('"+key+"')\"><div class='w3-bar-item'><span class='w3-large'>"+users[key].username+"</span><br><span>"+isOnline+"</span></div></li>"
        }
        document.getElementById("users-list-ul").innerHTML = htmlContent
    }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    });

    userRef.on('child_added', (data) => {
        var msgJson = data.val();
            // ...

            let isOnline = "offline"
            if(msgJson.isOnline == true)
                isOnline = "online"
        let el = document.createElement('div');
        el.innerHTML = "<li id='user-"+data.key +"' class='w3-bar' onclick=\"clickforChat('"+data.key +"')\"><div class='w3-bar-item'><span class='w3-large'>"+msgJson.username+"</span><br><span>"+isOnline+"</span></div></li>"

        document.getElementById("users-list-ul").append(el)

    });

    userRef.on('child_changed', (data) => {
        if(data.key == currentUid)
            return
        var user = data.val();
        var userid = data.key
            // ...

            let isOnline = "offline"
            if(user.isOnline == true)
                isOnline = "online"
        let el = document.getElementById('user-'+userid);
        htmlContent = "<div class='w3-bar-item'><span class='w3-large'>"+user.username+"</span><br><span>"+isOnline+"</span></div>"

        el.innerHTML = htmlContent

    });


    function signOut() {
        makeOffline()

        firebase.auth().signOut().then(function() {
            console.log('Signed Out');
        }, function(error) {
            console.error('Sign Out Error', error);
        });
    }


    function makeOffline(){
        if(currentUserRef){
            currentUserRef.update({
                isOnline : false
            });
            isCurrentUserOnline = false
        }

    }

    function makeOnline(){
        if(currentUserRef){
            currentUserRef.update({
                isOnline : true
            });
            isCurrentUserOnline = true
        }

    }



    var offlineTime = 10000;
    var offlineTTimer = setTimeout(makeOffline, offlineTime);

    var resetTimer = function() {
        if(!isCurrentUserOnline){
            makeOnline()
        }
        clearTimeout(offlineTTimer);
        offlineTTimer = setTimeout(makeOffline, offlineTime);    
    }

    window.addEventListener("load", function(){
        document.addEventListener('mousedown', resetTimer, true);
    });

    window.onbeforeunload = function(e) {
        makeOffline()
        return ;
     };

