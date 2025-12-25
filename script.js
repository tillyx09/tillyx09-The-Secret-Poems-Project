// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, 
  orderBy, query, updateDoc, doc, arrayUnion 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCGmnkS6eXxDzt2cDpH86s-RNJuAOyk8Os",
  authDomain: "anonymous-poetry.firebaseapp.com",
  projectId: "anonymous-poetry",
  storageBucket: "anonymous-poetry.appspot.com",
  messagingSenderId: "556609883473",
  appId: "1:556609883473:web:96564552801ef4dc9cd770"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Secret key for safe write access
const SECRET_KEY = "poetry123";

// Function to add a poem element to the page
function addPoemToPage(docSnap){
  const data = docSnap.data();
  const poemsContainer = document.getElementById("poems-container");
  if (!poemsContainer) return;

  const div = document.createElement("div");
  div.className = "poem";

  div.innerHTML = `
    <p>${data.content}</p>
    <small>— ${data.name || "unknown"}</small>
    <div class="poem-buttons">
      <button class="like-btn">❤️ ${data.likes || 0}</button>
      <button class="comment-btn">💬 Comment</button>
    </div>
    <div class="comment-section"></div>
  `;

  // Handle like button
  const likeBtn = div.querySelector(".like-btn");
  likeBtn.addEventListener("click", async ()=>{
    const docRef = doc(db,"poems",docSnap.id);
    await updateDoc(docRef,{likes:(data.likes||0)+1});
    loadPoems();
  });

  // Handle comment button
  const commentBtn = div.querySelector(".comment-btn");
  const commentSection = div.querySelector(".comment-section");
  let commentBox = null;
  commentBtn.addEventListener("click", ()=>{
    if(commentBox) return;
    commentBox = document.createElement("textarea");
    commentBox.className = "comment-box";
    commentBox.placeholder = "What do you think?...";
    
    const submitComment = document.createElement("button");
    submitComment.textContent = "Submit";
    submitComment.style.marginTop = "4px";
    submitComment.onclick = async ()=>{
      const commentText = commentBox.value.trim();
      if(!commentText) return;
      const docRef = doc(db,"poems",docSnap.id);
      await updateDoc(docRef,{comments: arrayUnion(commentText)});
      loadPoems();
    };

    commentSection.appendChild(commentBox);
    commentSection.appendChild(submitComment);
    commentBox.focus();
  });

  // Load existing comments
  if(data.comments){
    data.comments.forEach(c=>{
      const cDiv = document.createElement("div");
      cDiv.className = "comment";
      cDiv.textContent = c;
      commentSection.appendChild(cDiv);
    });
  }

  poemsContainer.appendChild(div);
}

// Load all poems
async function loadPoems(){
  const poemsContainer = document.getElementById("poems-container");
  if(!poemsContainer) return;
  poemsContainer.innerHTML = "";

  try {
    const q = query(collection(db,"poems"), orderBy("createdAt","desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => addPoemToPage(docSnap));
  } catch(err){
    console.error("Error loading poems:", err);
    alert("Could not load poems: "+err.message);
  }
}

// Handle poem submission (submit.html)
const form = document.getElementById("poem-form");
if(form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const text = document.getElementById("poem-text").value.trim();
    if(!text) return alert("Write something first please");

    try {
      await addDoc(collection(db,"poems"),{
        content: text,
        name: "unknown",
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
        secretKey: SECRET_KEY
      });

      alert("Your poem is now live!");
      document.getElementById("poem-text").value = "";
    } catch(err){
      console.error("Error submitting poem:", err);
      alert("Error: "+err.message);
    }
  });
}

// Load poems on page load
window.addEventListener("DOMContentLoaded", loadPoems);
