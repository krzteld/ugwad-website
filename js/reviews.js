// ==========================================
// UGWAD CUSTOMER REVIEWS
// Member 3 - reviews.js
// ==========================================

const reviewsDB = window.supabaseClient;

const reviewForm = document.getElementById("reviewForm");
const reviewsList = document.getElementById("reviewsList");


// ==========================================
// 1. DISPLAY CUSTOMER REVIEWS
// ==========================================

async function loadReviews() {

    try {

        if (!reviewsDB) {
            throw new Error("Supabase connection is missing.");
        }

        const { data: reviews, error } = await reviewsDB
            .from("reviews")
            .select("id, reviewer_name, product_purchased, rating, comment, created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        reviewsList.innerHTML = "";

        if (!reviews || reviews.length === 0) {

            reviewsList.textContent =
                "No reviews yet. Be the first to share your experience!";

            return;
        }


        reviews.forEach(review => {

            const card = document.createElement("div");
            card.className = "review-card";


            // Reviewer name
            const name = document.createElement("h3");
            name.textContent = review.reviewer_name;


            // Product
            const product = document.createElement("p");
            product.textContent = "Product: " + review.product_purchased;


            // Star rating
            const stars = document.createElement("div");
            stars.className = "stars";

            const rating = Math.max(
                0,
                Math.min(5, Number(review.rating) || 0)
            );

            stars.textContent =
                "★".repeat(rating) +
                "☆".repeat(5 - rating);


            // Review comment
            const comment = document.createElement("p");
            comment.textContent = review.comment;


            // Date
            const date = document.createElement("small");

            if (review.created_at) {
                date.textContent =
                    new Date(review.created_at).toLocaleDateString();
            }


            // Edit button
            const editButton = document.createElement("button");

            editButton.textContent = "Edit";

            editButton.addEventListener("click", function() {
                editReview(review);
            });


            // Delete button
            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";

            deleteButton.addEventListener("click", function() {
                deleteReview(review);
            });


            const actions = document.createElement("div");
            actions.className = "review-actions";

            actions.append(editButton, deleteButton);

            card.append(
                name,
                product,
                stars,
                comment,
                date,
                actions
            );

            reviewsList.appendChild(card);

        });

    } catch (error) {

        console.error("Loading reviews error:", error);

        reviewsList.textContent =
            "Unable to load reviews. Please try again later.";

    }

}


// ==========================================
// 2. CREATE A REVIEW
// ==========================================

reviewForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    try {

        if (!reviewsDB) {
            throw new Error("Supabase connection is missing.");
        }


        // Get information from the form
        const reviewerName =
            document.getElementById("reviewerName").value.trim();

        const product =
            document.getElementById("reviewProduct").value;

        const rating = Number(
            document.getElementById("reviewRating").value
        );

        const comment =
            document.getElementById("reviewComment").value.trim();

        const reviewPin =
            document.getElementById("reviewPin").value;


        // Required fields
        if (
            !reviewerName ||
            !product ||
            !rating ||
            !comment ||
            !reviewPin
        ) {

            alert("Please complete all review fields.");

            return;
        }


        // Number validation
        if (
            typeof validateNumberRange === "function" &&
            validateNumberRange("Rating", rating, 1, 5) === false
        ) {
            return;
        }

        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {

            alert("Rating must be between 1 and 5.");

            return;
        }


        // PIN validation
        if (typeof validatePin === "function") {

            if (validatePin(reviewPin) === false) return;

        } else if (!/^\d{4}$/.test(reviewPin)) {

            alert("Please enter a valid 4-digit PIN.");

            return;
        }


        // Prepare data
        const reviewData = {

            reviewer_name: reviewerName,
            product_purchased: product,
            rating: rating,
            comment: comment,
            review_pin: reviewPin

        };


        // Save review
        const { error } = await reviewsDB
            .from("reviews")
            .insert([reviewData]);

        if (error) throw error;


        alert("Thank you for sharing your experience!");

        reviewForm.reset();

        await loadReviews();


    } catch (error) {

        console.error("Create review error:", error);

        alert("Unable to submit review: " + error.message);

    }

});


// ==========================================
// 3. VERIFY REVIEW PIN
// ==========================================

async function verifyReviewPIN(review) {

    const enteredPIN = prompt(
        "Enter your 4-digit Review PIN:"
    );

    if (enteredPIN === null) {
        return false;
    }

    const adminPIN = typeof CONFIG !== "undefined" ? CONFIG.ORG_PASSCODE : null;

    // Organization administrator
    if (adminPIN && enteredPIN === adminPIN) {
        return true;
    }


    // Retrieve the PIN for verification.
    // This requires an appropriately secured
    // Supabase access policy.

    const { data, error } = await reviewsDB
        .from("reviews")
        .select("review_pin")
        .eq("id", review.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data || enteredPIN !== data.review_pin) {

        alert("Incorrect PIN. Access denied.");

        return false;
    }

    return true;

}


// ==========================================
// 4. UPDATE A REVIEW
// ==========================================

async function editReview(review) {

    try {

        const verified = await verifyReviewPIN(review);

        if (!verified) return;


        // New rating
        const newRating = prompt(
            "Enter your new rating (1-5):",
            review.rating
        );

        if (newRating === null) return;

        const rating = Number(newRating);

        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {

            alert("Rating must be between 1 and 5.");

            return;
        }


        // New comment
        const newComment = prompt(
            "Enter your updated comment:",
            review.comment
        );

        if (newComment === null) return;

        if (!newComment.trim()) {

            alert("Comment cannot be empty.");

            return;
        }


        // Update Supabase record
        const { error } = await reviewsDB
            .from("reviews")
            .update({

                rating: rating,
                comment: newComment.trim()

            })
            .eq("id", review.id);

        if (error) throw error;


        alert("Your review has been updated!");

        await loadReviews();


    } catch (error) {

        console.error("Update review error:", error);

        alert("Unable to update review: " + error.message);

    }

}


// ==========================================
// 5. DELETE A REVIEW
// ==========================================

async function deleteReview(review) {

    try {

        const verified = await verifyReviewPIN(review);

        if (!verified) return;


        // Required confirmation function
        if (!confirmDelete("this review")) return;


        const { error } = await reviewsDB
            .from("reviews")
            .delete()
            .eq("id", review.id);

        if (error) throw error;


        alert("Your review has been deleted!");

        await loadReviews();


    } catch (error) {

        console.error("Delete review error:", error);

        alert("Unable to delete review: " + error.message);

    }

}


// ==========================================
// 6. LOAD REVIEWS WHEN PAGE OPENS
// ==========================================
async function loadReviewProducts() {
    const select = document.getElementById("reviewProduct");

    if (!select || !reviewsDB) return;

    const { data, error } = await reviewsDB
        .from("products")
        .select("name")
        .order("name", { ascending: true });

    if (error) {
        console.error("Loading review products error:", error);
        select.innerHTML = '<option value="">Could not load products</option>';
        return;
    }

    select.innerHTML = "";
    select.add(new Option("-- Select product --", ""));

    (data || []).forEach(function(item) {
        select.add(new Option(item.name, item.name));
    });
}
loadReviewProducts();
loadReviews();
