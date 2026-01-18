const client_id = 'gfmucqaudg8w80g';
const redirect_uri = 'https://sakadayo.github.io/scratch-virtual-exchange';
setTimeout(() => {
    console.log("3秒経過");
}, 3000);
document.getElementById("alert").innerHTML = "";
class Update{
    connect(){
        console.log(client_id);
        console.log(redirect_uri);
        console.log(`https://www.dropbox.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`);
        window.open(`https://www.dropbox.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`, '_blank');
        var a = location.search;
        var result = code.split('=');
        var code = result[1];
        
    }
}

var ins = new Update();
ins.connect();