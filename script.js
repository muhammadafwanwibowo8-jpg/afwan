script.js /* ==========================================
   SUPABASE
========================================== */

// GANTI 2 BAGIAN INI DENGAN DATA SUPABASE KAMU
const SUPABASE_URL = "MASUKKAN_SUPABASE_URL_KAMU";
const SUPABASE_ANON_KEY = "MASUKKAN_SUPABASE_ANON_KEY_KAMU";

let supabaseClient = null;

if (
    SUPABASE_URL !== "MASUKKAN_SUPABASE_URL_KAMU" &&
    SUPABASE_ANON_KEY !== "MASUKKAN_SUPABASE_ANON_KEY_KAMU" &&
    window.supabase
) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
}


/* ==========================================
   MOBILE MENU / TOMBOL GARIS 3
========================================== */

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function () {
        navMenu.classList.toggle("active");
    });
}

document.querySelectorAll("nav a").forEach(function (link) {
    link.addEventListener("click", function () {
        if (navMenu) {
            navMenu.classList.remove("active");
        }
    });
});


/* ==========================================
   TAHUN FOOTER
========================================== */

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


/* ==========================================
   COMMENT ELEMENTS
========================================== */

const commentForm = document.getElementById("commentForm");
const commentName = document.getElementById("commentName");
const commentText = document.getElementById("commentText");
const commentButton = document.getElementById("commentButton");
const commentStatus = document.getElementById("commentStatus");
const commentsContainer = document.getElementById("commentsContainer");
const commentCount = document.getElementById("commentCount");


/* ==========================================
   STATUS
========================================== */

function setStatus(message) {
    if (commentStatus) {
        commentStatus.textContent = message;
    }
}


/* ==========================================
   FORMAT TANGGAL
========================================== */

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


/* ==========================================
   ID PENGUNJUNG
========================================== */

function getVoterId() {
    let voterId = localStorage.getItem("afwan_voter_id");

    if (!voterId) {
        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            voterId = window.crypto.randomUUID();
        } else {
            voterId =
                "voter_" +
                Date.now() +
                "_" +
                Math.random().toString(36).substring(2);
        }

        localStorage.setItem("afwan_voter_id", voterId);
    }

    return voterId;
}


/* ==========================================
   REACTION BUTTON
========================================== */

function createReactionButton(
    type,
    id,
    count,
    active,
    clickFunction
) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "comment-reaction";

    if (active) {
        button.classList.add("active");
    }

    if (type === "like") {
        button.innerHTML = `👍 Suka <span>${count || 0}</span>`;
    } else {
        button.innerHTML = `👎 Tidak Suka <span>${count || 0}</span>`;
    }

    button.addEventListener("click", clickFunction);

    return button;
}


/* ==========================================
   LOAD STORY REACTION
========================================== */

async function loadStoryReaction() {
    const likeCount = document.getElementById("storyLikes");
    const dislikeCount = document.getElementById("storyDislikes");
    const likeButton = document.getElementById("storyLikeButton");
    const dislikeButton = document.getElementById("storyDislikeButton");

    if (!likeCount || !dislikeCount) {
        return;
    }

    if (!supabaseClient) {
        likeCount.textContent = "0";
        dislikeCount.textContent = "0";
        return;
    }

    const { data, error } = await supabaseClient
        .from("story_reactions")
        .select("likes, dislikes")
        .eq("id", 1)
        .single();

    if (error) {
        console.error("Gagal mengambil reaction cerita:", error);
        return;
    }

    likeCount.textContent = data.likes || 0;
    dislikeCount.textContent = data.dislikes || 0;

    const savedReaction = localStorage.getItem(
        "story_reaction"
    );

    if (likeButton) {
        likeButton.classList.toggle(
            "active",
            savedReaction === "like"
        );
    }

    if (dislikeButton) {
        dislikeButton.classList.toggle(
            "active",
            savedReaction === "dislike"
        );
    }
}


/* ==========================================
   REACT TO STORY
========================================== */

async function reactToStory(reactionType) {
    if (!supabaseClient) {
        alert("Database Supabase belum dihubungkan.");
        return;
    }

    const voterId = getVoterId();

    const status = document.getElementById(
        "storyReactionStatus"
    );

    if (status) {
        status.textContent = "Menyimpan...";
    }

    const { error } = await supabaseClient.rpc(
        "react_to_story",
        {
            voter_id_input: voterId,
            reaction_type_input: reactionType
        }
    );

    if (error) {
        console.error("Gagal memberikan reaction:", error);

        if (status) {
            status.textContent =
                "Reaction gagal disimpan.";
        }

        return;
    }

    localStorage.setItem(
        "story_reaction",
        reactionType
    );

    if (status) {
        status.textContent = "Reaction tersimpan ✓";
    }

    await loadStoryReaction();
}


/* ==========================================
   STORY BUTTON
========================================== */

const storyLikeButton =
    document.getElementById("storyLikeButton");

const storyDislikeButton =
    document.getElementById("storyDislikeButton");

if (storyLikeButton) {
    storyLikeButton.addEventListener("click", function () {
        reactToStory("like");
    });
}

if (storyDislikeButton) {
    storyDislikeButton.addEventListener(
        "click",
        function () {
            reactToStory("dislike");
        }
    );
}


/* ==========================================
   LOAD COMMENTS
========================================== */

async function loadComments() {
    if (!commentsContainer) {
        return;
    }

    if (!supabaseClient) {
        commentsContainer.innerHTML = `
            <div class="no-comments">
                Database belum dihubungkan.
            </div>
        `;

        if (commentCount) {
            commentCount.textContent = "0";
        }

        return;
    }

    commentsContainer.innerHTML = `
        <div class="loading">
            Memuat komentar...
        </div>
    `;

    const { data, error } = await supabaseClient
        .from("comments")
        .select(
            "id, name, comment, created_at, likes, dislikes"
        )
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Gagal mengambil komentar:",
            error
        );

        commentsContainer.innerHTML = `
            <div class="no-comments">
                Komentar belum dapat dimuat.
            </div>
        `;

        return;
    }

    if (commentCount) {
        commentCount.textContent = data.length;
    }

    if (data.length === 0) {
        commentsContainer.innerHTML = `
            <div class="no-comments">
                Belum ada komentar.
                Jadilah yang pertama berkomentar.
            </div>
        `;

        return;
    }

    commentsContainer.innerHTML = "";

    data.forEach(function (item) {
        const commentItem =
            document.createElement("div");

        commentItem.className = "comment-item";

        /* HEADER */

        const header =
            document.createElement("div");

        header.className = "comment-header";

        const name =
            document.createElement("span");

        name.className = "comment-name";
        name.textContent = item.name;

        const date =
            document.createElement("span");

        date.className = "comment-date";
        date.textContent =
            formatDate(item.created_at);

        header.appendChild(name);
        header.appendChild(date);

        /* COMMENT TEXT */

        const text =
            document.createElement("div");

        text.className = "comment-text";
        text.textContent = item.comment;

        /* REACTION AREA */

        const reactionArea =
            document.createElement("div");

        reactionArea.className =
            "comment-reactions";

        const savedReaction =
            localStorage.getItem(
                "comment_reaction_" + item.id
            );

        const likeButton =
            createReactionButton(
                "like",
                item.id,
                item.likes,
                savedReaction === "like",
                function () {
                    reactToComment(
                        item.id,
                        "like"
                    );
                }
            );

        const dislikeButton =
            createReactionButton(
                "dislike",
                item.id,
                item.dislikes,
                savedReaction === "dislike",
                function () {
                    reactToComment(
                        item.id,
                        "dislike"
                    );
                }
            );

        reactionArea.appendChild(likeButton);
        reactionArea.appendChild(dislikeButton);

        /* GABUNG */

        commentItem.appendChild(header);
        commentItem.appendChild(text);
        commentItem.appendChild(reactionArea);

        commentsContainer.appendChild(
            commentItem
        );
    });
}


/* ==========================================
   REACT TO COMMENT
========================================== */

async function reactToComment(
    commentId,
    reactionType
) {
    if (!supabaseClient) {
        alert("Database Supabase belum dihubungkan.");
        return;
    }

    const voterId = getVoterId();

    const { error } =
        await supabaseClient.rpc(
            "react_to_comment",
            {
                comment_id_input: commentId,
                voter_id_input: voterId,
                reaction_type_input: reactionType
            }
        );

    if (error) {
        console.error(
            "Gagal memberikan reaction komentar:",
            error
        );

        alert("Reaction gagal disimpan.");
        return;
    }

    localStorage.setItem(
        "comment_reaction_" + commentId,
        reactionType
    );

    await loadComments();
}


/* ==========================================
   SEND COMMENT
========================================== */

if (commentForm) {
    commentForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            if (!supabaseClient) {
                setStatus(
                    "Database belum terhubung."
                );
                return;
            }

            const name =
                commentName.value.trim();

            const comment =
                commentText.value.trim();

            if (!name || !comment) {
                setStatus(
                    "Nama dan komentar wajib diisi."
                );
                return;
            }

            if (name.length > 50) {
                setStatus(
                    "Nama maksimal 50 karakter."
                );
                return;
            }

            if (comment.length > 500) {
                setStatus(
                    "Komentar maksimal 500 karakter."
                );
                return;
            }

            commentButton.disabled = true;
            commentButton.textContent =
                "Mengirim...";

            setStatus("");

            const { error } =
                await supabaseClient
                    .from("comments")
                    .insert([
                        {
                            name: name,
                            comment: comment
                        }
                    ]);

            if (error) {
                console.error(
                    "Gagal mengirim komentar:",
                    error
                );

                setStatus(
                    "Komentar gagal dikirim. Silakan coba lagi."
                );

                commentButton.disabled = false;
                commentButton.textContent =
                    "Kirim Komentar";

                return;
            }

            commentForm.reset();

            setStatus(
                "Komentar berhasil dikirim ✓"
            );

            commentButton.disabled = false;
            commentButton.textContent =
                "Kirim Komentar";

            await loadComments();
        }
    );
}


/* ==========================================
   REALTIME COMMENTS
========================================== */

function enableRealtime() {
    if (!supabaseClient) {
        return;
    }

    supabaseClient
        .channel("comments-channel")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "comments"
            },
            function () {
                loadComments();
            }
        )
        .subscribe();
}


/* ==========================================
   START WEBSITE
========================================== */

loadComments();
loadStoryReaction();
enableRealtime();