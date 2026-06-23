export async function POST(evt) {
    // convert search params to object
    let params = {};
    for (let [key, val] of evt.url.searchParams) {
        params[key] = val
    }
    // request token
    let data = await fetch(
        `${params.root}/oauth/token`, 
        {
            method: "POST",
            body: JSON.stringify({
                client_id: params.client,
                code: params.code,
                grant_type: "authorization_code",
                redirect_uri: params.redirect,
                code_verifier: params.verifier
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }
    ).then(
        resp => resp.json()
    )

    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}