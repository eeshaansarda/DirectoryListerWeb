//Variables to keep track
let selectedNum = 1;
let lighttheme = true;
let drawerclosed = true;
let issearchresult = false;
let currentDir;

//Constants to use
const lightthemecolors = ["#F7F9FB", "#95c2dc", "#31708E", "#ddd", "black"];
const darkthemecolors = ["#121212", "#bb86fc","#4d4d4d", "#2e2e2e", "#F7F9FB"];
let tableheaders = [] //different for search and normal

//constant html vars but not loaded here
let emptytabledivHTML;
let servertextHTML;
let currentdirtextHTML;
let tablerows;
let tableHTML;

//Wait for the window to load
window.onload = () => {
    console.log("Client side script working");
    setHTMLVar();
    document.addEventListener("keydown", move);
    fetchdirinfo("/");
}

//Set HTML vars
function setHTMLVar() {
   emptytabledivHTML = document.getElementById("empty");
   servertextHTML = document.getElementById("current-server");
   currentdirtextHTML = document.getElementById("current-dir");
   tablerows = document.getElementsByTagName("tr");
   tableHTML = document.getElementById("folder-contents");
}

//reset variables and table
function reset(res){
    //set vars
    issearchresult = "search" == res.response;
    selectedNum = 1;
    currentDir = issearchresult ? currentDir :res.info.directoryname;

    //re(create) HTML
    updateTable(res.info.files);
    createDrawerContent();
    selectAndDeselect();
    servertextHTML.innerText = res.info.server;
    currentdirtextHTML.innerText = res.info.directoryname;
}

//Handles keystrokes
function move(e) {
    switch(e.code) {
        case "KeyJ":
        case "ArrowDown":
            if(selectedNum < tablerows.length - 1)
                selectedNum++;
            selectAndDeselect();
            break;
        case "KeyK":
        case "ArrowUp":
            if(selectedNum > 1)
                selectedNum--;
            selectAndDeselect();
            break;
        case "Enter":
        case "KeyL":
        case "ArrowRight":
            tablerows[selectedNum].click();
            break;
        case "KeyH":
        case "ArrowLeft":
            tablerows[1].click();
            break;
        default:
            //Not a key stroke that is being used
    }
}

//reset table
function updateTable(listOfObj) {
    //Removes existing table
    tableHTML.innerHTML = "";

    if(listOfObj.length === 0){
        //Tell the user there is no result
        emptytabledivHTML.style.display = "block";
        tableheaders = [];
    }
    else {
        //create the table
        emptytabledivHTML.style.display = "none";
        tableheaders = Object.keys(listOfObj[0]);

        //create header
        createHeader();

        //could not find a better way
        if(!issearchresult) {
            createRow({"name": "Parent Directory", "type": "directory",
                    "":""," ":"","  ":"","   ":"","    ":""});
        }
        //create content
        listOfObj.forEach((item) => createRow(item));
    }
}

//create header
function createHeader() {
    const tablerow = document.createElement("tr");
    tableheaders.forEach( key => {
        const tabledata = document.createElement("th");
        tabledata.setAttribute("onclick", "sortColumn(this)");
        tabledata.innerText = key;
        tablerow.appendChild(tabledata);
    });
    tableHTML.appendChild(tablerow);
}

//create row
function createRow(data) {
    const tablerow = document.createElement("tr");
    tablerow.onmouseover = function() {select(this)};

    //only be clickable if dir
    if(data.type == "directory") {
        tablerow.setAttribute("onclick", "fetchdirinfo(this)");
    }

    Object.values(data).forEach( value => {
        const tabledata = document.createElement("td");
        tabledata.innerText = value;
        tablerow.appendChild(tabledata);
    });
    tableHTML.appendChild(tablerow);
}

//Handles fetching dirinfo
function fetchdirinfo(dirpath) {
    let data = {
        "request": "dirinfo",
        "currentdirectory": currentDir
    };

    //Would have used path but this isnot run by node
    if(dirpath === "/") {
        data["dirpath"] = "/";
    }
    else if(dirpath == "") {
        data["dirpath"] = currentDir;
    }
    else if(issearchresult) {
        data["dirpath"] = dirpath.childNodes[7].innerText + "/" +
                    dirpath.childNodes[0].innerText;
    }
    else {
        data["dirpath"] = dirpath.childNodes[0].innerText;
    }

    fetchapi(data);
}

//fetches search result
function fetchsearch(searchinput) {
    document.getElementById("close-icon").style.display = "block";
    const data = {
        "request": "search",
        "currentdirectory": currentDir,
        "searchstring": searchinput.value
    };
    fetchapi(data);
}

//all fetch method uses this
function fetchapi(data) {
    fetch("api", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).
    then(res => res.json()).
    then(res => reset(res)).
    catch(err => console.log(err));
}

//deselect all and select the specified
function select(x) {
    deselectall();
    x.setAttribute("class", "selected");
    selectedNum = getIndexHTMLCollection(tablerows, x);
}

//deselect all and select the specified
function selectAndDeselect() {
    deselectall();
    if(tablerows[selectedNum])
        tablerows[selectedNum].setAttribute("class", "selected");
}

//deselect all
function deselectall() {
    for(let i = 0; i < tablerows.length; i++) {
        if(tablerows[i].getAttribute("class"))
            tablerows[i].removeAttribute("class");
    }
}

//get index of
function getIndexHTMLCollection(collection, element) {
    let arr = Array.prototype.slice.call(collection);
    return arr.indexOf(element);
}

//change theme
function changeTheme() {
    let root = document.documentElement;
    if(lighttheme) {
        //Change to dark theme
        root.style.setProperty("--bg-color", darkthemecolors[0]);
        root.style.setProperty("--selected-color", darkthemecolors[1]);
        root.style.setProperty("--secondary-color", darkthemecolors[2]);
        root.style.setProperty("--border-color", darkthemecolors[3]);
        root.style.setProperty("--font-color", darkthemecolors[4]);
    }
    else {
        //Change to light theme
        root.style.setProperty("--bg-color", lightthemecolors[0]);
        root.style.setProperty("--selected-color", lightthemecolors[1]);
        root.style.setProperty("--secondary-color", lightthemecolors[2]);
        root.style.setProperty("--border-color", lightthemecolors[3]);
        root.style.setProperty("--font-color", lightthemecolors[4]);
    }
    lighttheme = !lighttheme;
}

//open drawer
function openDrawer() {
    const drawer = document.getElementById("drawer");
    drawer.style.display = drawerclosed ? "block": "none";
    drawerclosed = !drawerclosed;
}

//create drawer
function createDrawerContent() {
    const drawer = document.getElementById("checkbox-drawer");
    drawer.innerHTML = ""; //remove existing
    tableheaders.forEach( key => {
        const surrounddiv = document.createElement("div");
        surrounddiv.setAttribute("class", "checkboxes-div")
        const checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("onclick", "hideColumn(this)");
        checkbox.setAttribute("name", key);
        checkbox.checked = true;
        const label = document.createElement("label");
        label.innerText = key;
        surrounddiv.appendChild(checkbox);
        surrounddiv.appendChild(label);
        drawer.appendChild(surrounddiv);
    });
}

//Hide column
function hideColumn(checkbox) {
    let index = tableheaders.indexOf(checkbox.getAttribute("name"));
    for(let i = 0; i < tablerows.length; i++) {
        let display = checkbox.checked? "": "none";
        tablerows[i].childNodes[index].style.display = display;
    }
}

//Would have added arrows to <th> but looks messy
//sorts rows to given column
function sortColumn(tableheader) {
    let index = tableheaders.indexOf(tableheader.innerHTML);
    let columnContent = [];

    let x = issearchresult ? 1 : 2;
    while(x < tablerows.length) {
        columnContent.push(tablerows[x].childNodes[index].innerHTML);
        x++;
    }

    if(columnContent.length > 0){
        if(!isNaN(parseFloat(columnContent[0]))) {
            columnContent.sort((a, b) => a - b);
        }
        else if(tableheaders[index].includes("time")) {
            columnContent.sort(
                (a, b) => new Date(b) - new Date(a)
            );
        }
        else {
            columnContent.sort();
        }

        if(columnContent[0] ==
           tablerows[issearchresult ? 1 : 2].childNodes[index].innerHTML) {
            //Sorted then reverse it
            columnContent.reverse();
        }

        for(let i = 0; i < columnContent.length; i++) {
            let trIndex = getTableRowsIndex(columnContent[i], index);
            tablerows[trIndex].parentNode.appendChild(tablerows[trIndex]);
        }
        tablerows = document.getElementsByTagName("tr");
    }
}

//the index is for the column
function getTableRowsIndex(element, index) {
    //no parent directory result
    let i = issearchresult ? 1 : 2;
    while(i < tablerows.length) {
        if(element == tablerows[i].childNodes[index].innerHTML)
            return i;
        i++;
    }
    return -1;
}

//Used by the cross near search
function backtodir() {
    document.getElementById("close-icon").style.display = "none";
    document.getElementById("search-field").value = "";
    fetchdirinfo("");
}
