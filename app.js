//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require('lodash');

const homeStartingContent = "Publish your passions, your way.";
const contactContent = "This made with ❤️ by Angela at The App Brewery.";
const aboutContent = "This is a simple blog website developed using bootstrap, ejs, nodejs and mongodb.";

const app = express();

const uri = 'mongodb+srv://cong:cong@cluster0-vb5ud.mongodb.net/blogpostsdb?retryWrites=true';
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}, function(err) {
  if (!err) {
    console.log("Succesfully connected to blogpostsdb database!");
  } else {
    mongoose.connection.close();
    console.log("Failed to connect to blogpostsdb database!", err);
    process.exit(500);;
  }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please check your data entry, no title specified!']
  },
  content: String
});

const Post = mongoose.model('Post', postSchema);


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {

  Post.find(function(err, foundPosts) {
    if (!err && foundPosts.length > 0) {
      const shortPosts = foundPosts.map(post => {
        return {
          id: post._id,
          title: post.title,
          content: _.truncate(post.content, {'length': 100})
        };
      });
      res.render("home", {postTitle: "Home", homeContent: homeStartingContent, posts: shortPosts});
    } else {
      console.log(err);
      res.render("home", {postTitle: "Home", homeContent: homeStartingContent, posts: []});
    }
  });

});

app.get("/about", function(req, res) {
  res.render("about", {postTitle: "About", aboutContent: aboutContent});
});

app.get("/contact", function(req, res) {
  res.render("contact", {postTitle: "Contact", contactContent: contactContent});
});

app.get("/compose", function(req, res) {
  res.render("compose", {postTitle: "Compose"});
})

app.post("/compose", async function(req, res) {
  const postTitle = req.body.postTitle;
  const postContent = req.body.postBody;

  if (postTitle.length > 0) {
    const newPost = new Post({
      title: postTitle,
      content: postContent
    });

    try {
      const savedNewPost = await newPost.save();
      if (savedNewPost === newPost) {
        res.redirect("/");
      }
    } catch (e) {
      console.log(e);
    }
  } else {
    console.log("Post title is not specified!");
    res.redirect("/");
  }

})

app.get("/posts/:postTitle-:postId", function(req, res) {

  const postTitle = req.params.postTitle;
  const postId = req.params.postId;

  if (postTitle.length > 0) {
    let query1 = {};
    let query2 = {};
    query1["title"] = new RegExp(postTitle, 'i');
    query2["_id"] = postId;

    console.log(query1, query2);

    Post.find({ $and: [query1, query2] }, function(err, foundPosts) {
      // console.log(err, foundPosts);

      if (!err && foundPosts.length > 0) {
        res.render("post", {
          posts: foundPosts
        });
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }

});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server is running on port " + port);
});
