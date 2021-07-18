
firebase.initializeApp(firebaseConfig);

var currentUid = null;  
 var database = firebase.database();

var userRef = database.ref('users');

var currentUserRef = null
var isCurrentUserOnline = null

var currentChatRef = null
var currentchatid = null
var currentchatuserid = null

//var chatuserid = null;
var chatusername = null;

var friendsChatListners = {}



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

   currentUserRef.get().then((snapshot) => {
        if (snapshot.exists()) {
            makeOnline()
        } else {
            currentUserRef.set({
                username: user.displayName,
                email: user.email,
                isOnline : true
            });
            isCurrentUserOnline = true
        }
    }).catch((error) => {
        console.error(error);
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
    currentchatuserid = chatuserId
    document.getElementById("info-panel").style.display= "none"
    document.getElementById("right-panel").style.display= "block"

    var chatuserIdref  = database.ref().child("users").child(chatuserId)

    //checking whether chat is linkned to user
    currentUserRef.child("friends").child(chatuserId).get().then((snapshot) => {
        if (!snapshot.exists()) {
            currentUserRef.child("friends").child(chatuserId).set(true);
            chatuserIdref.child("friends").child(currentUid).set(true);
        } 
    }).catch((error) => {
        console.error(error);
    });

    //finding username 
    chatuserIdref.once('value', (snapshot) => {
        if (snapshot.exists()) {
            //console.log(snapshot.val());
            chatusername = snapshot.val().username
            document.getElementById("chat-header").innerText ="messages : " + chatusername
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
            var msgkey = childSnapshot.key
            // ...
            if(msgJson.sender == currentUid){
                htmlContent += "<div id='chat-"+childSnapshot.key+"' class='container'><p><b> ME </b>: "+msgJson.msg+"</p><span class='time-right'>"+ new Date(msgJson.timestamp * 1000).toLocaleString()+"</span>"

                if (msgJson.deliveredAt){
                    htmlContent += "<span id='delivered-"+msgkey+"' class='time-left' title='delivered at : "+ new Date(msgJson.deliveredAt * 1000).toLocaleString()+"'>delivered</span><br>"
                }
                if(msgJson.seenAt) {
                    htmlContent += "<span id='seen-"+msgkey+"' class='time-left' title='seen at : "+new Date(msgJson.seenAt * 1000).toLocaleString() +"'>seen</span>"
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

        document.getElementById("user-"+chatuserId+"-unread").innerText =""

        window.scrollTo(0,document.body.scrollHeight);
    });

    // currentChatRef.on('child_added', (data) => {
    //     var msgJson = data.val();
    //         // ...
    //     let el = document.createElement('div');
    //     if(!document.getElementById("chat-" + data.key)){
    //         if(msgJson.sender == currentUid){
    //             el.innerHTML = "<div id='chat-"+data.key+"'  class='container'><p><b> ME </b>: "+msgJson.msg+"</p><span class='time-right'>"+ new Date(msgJson.timestamp * 1000).toUTCString()+"</span></div>"
    //         }
    
    //         else{
    //             el.innerHTML = "<div id='chat-"+data.key+"' class='container darker'><p><b> "+chatusername+"</b> : "+msgJson.msg+"</p><span class='time-left'>"+ new Date(msgJson.timestamp * 1000).toUTCString()+"</span></div>"
    //         }
    //         document.getElementById("message-container").append(el)
    //         window.scrollTo(0,document.body.scrollHeight);
    //     }

    //     if(msgJson.sender != currentUid  && !msgJson.seenAt){
    //         let updateJson ={}
    //         if(!msgJson.deliveredAt)
    //             updateJson.deliveredAt = firebase.database.ServerValue.TIMESTAMP
    //         updateJson.seenAt = firebase.database.ServerValue.TIMESTAMP
    //         currentChatRef.child(data.key).update(updateJson);
    //     }
    // });

    currentChatRef.on('child_changed', (data) => {
        var msgJson = data.val();
        var chatkey = data.key
            // ...
        let el = document.getElementById('chat-'+data.key);
        if(el && msgJson.sender == currentUid  && (msgJson.seenAt || msgJson.deliveredAt)) {
            let temp = document.createElement('div');
            if (msgJson.deliveredAt && !document.getElementById('delivered-'+chatkey)){
                temp.innerHTML = "<span id='delivered-"+chatkey+"' class='time-left' title='delivered at : "+ new Date(msgJson.deliveredAt * 1000).toLocaleString()+"'>delivered</span><br>"
            }
            if(msgJson.seenAt && !document.getElementById('seen-'+chatkey)) {
                temp.innerHTML += "<span id='seen-"+chatkey+"' class='time-left' title='seen at : "+new Date(msgJson.seenAt * 1000).toLocaleString() +"'>seen</span>"
            }

            el.append(temp)
        }

    });
}

 function sendmsg() {
     let inputelem = document.getElementById("message-input")
     let inputmsg =  inputelem.value
    //  console.log(inputmsg)

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
        // console.log(snapshot.val());
        let users = snapshot.val()
        let htmlContent = ""
        for (const key in users) {
            if(key == currentUid){
                for(const frienduserid in users[key].friends){
                    checkForUnreadMsg(frienduserid)
                }
                database.ref('users/' + currentUid +"/friends").on('child_added', (data) => {

                    var newuserid = data.key;
                    // console.log(newuserid)
                    checkForUnreadMsg(newuserid);
                });
                continue;
            }

            let isOnline = "offline"
            if(users[key].isOnline == true)
                isOnline = "online"

            //console.log(`${key}: ${user[key]}`);
            htmlContent += "<li id='user-"+key +"' class='w3-bar' onclick=\"clickforChat('"+key+"')\"><div class='w3-bar-item'><span class='w3-large'>"+users[key].username+"</span><br><span id = 'user-"+key+"-status'>"+isOnline+"</span> <br> <div id = 'user-"+key+"-unread'></div></div></li>"
        }
        document.getElementById("users-list-ul").innerHTML = htmlContent
    }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    });

    // friendslist.forEach( (frienduserid) => {
    //     console.log(frienduserid)
    // })

    function checkForUnreadMsg(frienduserid) {
        var chatid = findChatid(currentUid ,frienduserid)
        database.ref('chats/'+chatid).once('value', (snapshot) => {

            snapshot.forEach((childSnapshot) => {
                var msgid = childSnapshot.key;
                var msgJson = childSnapshot.val();
                if(!msgJson.deliveredAt){
                    database.ref('chats/'+chatid +"/"+ msgid ).child('deliveredAt').set(firebase.database.ServerValue.TIMESTAMP);                   
                }
                if(!msgJson.seenAt && msgJson.sender != currentUid){
                    let el = document.getElementById('user-'+frienduserid+'-unread')
                    if(el){
                        el.innerText ="unread chat"
                    }
                }

            });         

            //let lastmsgid = Object.keys(snapshot.val()).pop()

            // database.ref('chats/'+chatid +"/"+ lastmsgid ).once('value', (snapshot) => {
            //     if(snapshot.val() && snapshot.val().sender != currentUid && !snapshot.val().seenAt){

            //     }
            // });


        });

        friendsChatListners[frienduserid] = database.ref('chats/'+chatid).on('child_added', (data) => {
            var msgJson = data.val();
                // ...
            let el = document.createElement('div');
            if((currentchatuserid == msgJson.sender ||  msgJson.sender ==  currentUid )&& !document.getElementById("chat-" + data.key)){
                if(msgJson.sender == currentUid){
                    el.innerHTML = "<div id='chat-"+data.key+"'  class='container'><p><b> ME </b>: "+msgJson.msg+"</p><span class='time-right'>"+ new Date(msgJson.timestamp * 1000).toUTCString()+"</span></div>"
                }
        
                else{
                    el.innerHTML = "<div id='chat-"+data.key+"' class='container darker'><p><b> "+chatusername+"</b> : "+msgJson.msg+"</p><span class='time-left'>"+ new Date(msgJson.timestamp * 1000).toUTCString()+"</span></div>"
                }
                document.getElementById("message-container").append(el)
                window.scrollTo(0,document.body.scrollHeight);
                if(msgJson.sender != currentUid  && !msgJson.seenAt){
                    let updateJson ={}
                    if(!msgJson.deliveredAt)
                        updateJson.deliveredAt = firebase.database.ServerValue.TIMESTAMP
                    updateJson.seenAt = firebase.database.ServerValue.TIMESTAMP
                    currentChatRef.child(data.key).update(updateJson);
                }
            }
            else{
                let el = document.getElementById('user-'+frienduserid+'-unread')
                if(el && !msgJson.seenAt && msgJson.sender != currentUid ){
                    el.innerText ="unread chat"
                }

                if( msgJson.sender != currentUid  && !msgJson.deliveredAt){
                    database.ref('chats/'+chatid +"/"+ data.key ).child('deliveredAt').set(firebase.database.ServerValue.TIMESTAMP);                   
                }
            }
    

        });

    }



    userRef.on('child_added', (data) => {
        var msgJson = data.val();
            // ...

            let isOnline = "offline"
            if(msgJson.isOnline == true)
                isOnline = "online"
        let el = document.createElement('div');
        el.innerHTML = "<li id='user-"+data.key +"' class='w3-bar' onclick=\"clickforChat('"+data.key +"')\"><div class='w3-bar-item'><span class='w3-large'>"+msgJson.username+"</span><br><span id = 'user-"+data.key+"-status'>"+isOnline+"</span><br> <div id = 'user-"+data.key+"-unread'></div></div></li>"

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
        let el = document.getElementById('user-'+userid+'-status');
        //htmlContent = "<div class='w3-bar-item'><span class='w3-large'>"+user.username+"</span><br><span>"+isOnline+"</span></div>"

        el.innerHTML = isOnline

    });


    function addmessageListner( frienduserid) {
        var chatid = "" 
        if(currentUid < frienduserid) 
            chatid = currentUid + frienduserid
        else 
            chatid = frienduserid + currentUid
        
        
    }

    function findChatid (userid1 , userid2) {
        if(userid1 < userid2) 
            return userid1 + userid2
        else 
            return  userid2 + userid1
    }


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



    var offlineTime = 20000;
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

