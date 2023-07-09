const path = require("path");
const express = require("express");
const fileInfo = require("./support/lib.js");
const os = require("os");

let args = process.argv.splice(2);
if(args.length !== 1) {
    console.log("node dir_list_server <root of dir>");
    return;
}

const root = args[0];
const app = express();
const port = process.getuid();
const hostname = os.hostname();

app.use(express.static("src"));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Handle post req
app.post("/api", (req, res) => {
    //Add buttons to create new folders
    const body = req.body;
    if(body.request == "dirinfo") {
        res.json(dirinfoResponse(body));
    } else if (body.request == "search") {
        res.json(searchResponse(body));
    }
});

app.get("/", (req, res) => {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.sendFile(__dirname + "/src/index.html");
});

app.get("*", (req, res) => {
    res.status(404).sendFile(__dirname + "/src/404.html");
});

app.listen(port, () => {
    console.log("Listening on port: " + port);
})

function dirinfoResponse(body) {
    let currDir = body.currentdirectory;
    if(body.dirpath == "Parent Directory") {
        if(currDir != root)
            currDir = path.join(currDir, "..");
    }
    else if(body.dirpath.includes(root)) {
        //from search results
        currDir = body.dirpath;
    }
    else if(body.dirpath == "/") {
        currDir = root;
    }
    else {
        currDir = path.join(currDir, body.dirpath);
    }

    return {
        "response": "dirinfo",
        "info": {
            "server": hostname,
            "directoryname": currDir,
            "files": fileInfo.getAllFileInfo(currDir)
        }
    }
}

function searchResponse(body) {
    let localRoot = body.currentdirectory;
    return {
        "response": "search",
        "info": {
            "server": hostname,
            "directoryname": "Search",
            "files": searchHelper(localRoot, body.searchstring)
        }
    };
}

function searchHelper(base, searchstring, result) {
    const files = fileInfo.getAllFileInfo(base);
    result = result || [];
    files.forEach(
        file => {
            if(file.type == "directory") {
                result = searchHelper(
                    path.join(base, file.name),
                    searchstring,
                    result
                );
            }
            if(file.name.includes(searchstring)) {
                file.location = base;
                result.push(file);
            }
        }
    );
    return result;
}
