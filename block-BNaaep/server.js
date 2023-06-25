var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");
var querystring = require("querystring");

function generateUserHTML(userData) {
  let htmlResponse = "<html><head><title>User Information</title></head><body>";
  htmlResponse += "<h1>User Information</h1>";
  htmlResponse += `<p>Username: ${userData.username}</p>`;
  htmlResponse += `<p>Name: ${userData.name}</p>`;
  htmlResponse += `<p>Email: ${userData.email}</p>`;
  htmlResponse += `<p>Age: ${userData.age}</p>`;
  htmlResponse += `<p>Bio: ${userData.bio}</p>`;
  htmlResponse += "</body></html>";

  return htmlResponse;
}

function handleGetRequest(pathname, req, res, store) {
  let dataFormat = req.url.split(".").pop();
  let imageName = path.basename(req.url);
  let urlUsername = querystring.parse(url.parse(req.url).query).username;

  if (pathname === "/" || pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream("./index.html").pipe(res);
  } else if (dataFormat === "css") {
    res.writeHead(200, { "Content-Type": "text/css" });
    fs.createReadStream("./assets/style.css").pipe(res);
  } else if (dataFormat === "jpg" || dataFormat === "jpeg") {
    console.log(pathname);
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    fs.createReadStream(`./assets/${imageName}`).pipe(res);
  } else if (pathname === "/about" || pathname === "/about.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream("./about.html").pipe(res);
  } else if (pathname === "/contacts") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream("./form.html").pipe(res);
  } else if (pathname === "/users" && urlUsername) {
    const filePath = path.join(__dirname, "contacts", `${urlUsername}.json`);
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("User not found");
      } else {
        const userData = JSON.parse(content);
        res.writeHead(200, { "Content-Type": "text/html" });
        const userHTML = generateUserHTML(userData);
        res.end(userHTML);
      }
    });
  } else if (pathname === "/users" && !urlUsername) {
    const contactsDirectory = path.join(__dirname, "contacts");
    fs.readdir(contactsDirectory, (err, files) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        let usersHTML = "<html><head><title>User List</title></head><body>";
        usersHTML += "<h1>User List</h1>";
        files.forEach((file) => {
          if (file.endsWith(".json")) {
            const filePath = path.join(contactsDirectory, file);
            const content = fs.readFileSync(filePath);
            const userData = JSON.parse(content);
            usersHTML += `<p><a href="/users?username=${userData.username}">${userData.name}</a></p>`;
          }
        });
        usersHTML += "</body></html>";
        res.end(usersHTML);
      }
    });
  }  else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
}

function handlePostRequest(pathname, req, res, store) {
  let formData = querystring.parse(store);
  let username = formData.username;
  let filepath = path.join(__dirname, "contacts", `${username}.json`);

  fs.open(filepath, "wx", (err, fd) => {
    if (err) {
      console.log(`Error opening the file : ${err}`);
      res.end(`Error opening the file : ${err}`);
    } else {
      fs.write(fd, JSON.stringify(formData), (err) => {
        if (err) {
          console.log(`Error writing the file : ${err}`);
          res.end(`Error writing the file : ${err}`);
        } else {
          fs.close(fd, (err) => {
            if (err) {
              console.log(`Error closing the file : ${err}`);
              res.end(`Error closing the file : ${err}`);
            } else {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end(
                `${username}.json saved successfully in contacts directory`
              );
            }
          });
        }
      });
    }
  });
}

function handleRequest(req, res) {
  let requestMethod = req.method;
  let { pathname } = url.parse(req.url);

  let store = "";
  req.on("data", (chunk) => {
    store += chunk;
  });

  if (requestMethod === "GET") {
    req.on("end", () => {
      handleGetRequest(pathname, req, res, store);
    });
  } else if (requestMethod === "POST") {
    req.on("end", () => {
      handlePostRequest(pathname, req, res, store);
    });
  }
}

var server = http.createServer(handleRequest);

server.listen(5000, () => {
  console.log("Server is listening to port 5000");
});
