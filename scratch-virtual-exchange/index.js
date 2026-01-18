const client_id = 'gfmucqaudg8w80g';
const redirect_uri = 'https://sakadayo.github.io/scratch-virtual-exchange';
var login = 'false';
function connect()
{
    if(login !== "true")
    {
        return 0;
    }
    window.local.href(`https://www.dropbox.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`);
    var query = location.search;
    var result = query.split('=');
    var code = result[1];
    console.log(code);
}