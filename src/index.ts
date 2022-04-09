import * as functions from 'firebase-functions'
import admin from 'firebase-admin'
admin.initializeApp()

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

type Recipe = {
    numRatings: number
    avgRating: number
}

exports.updateRatings = functions.firestore
    .document('/recipes/{recipeId}/ratings/{uid}')
    .onWrite(async (change, context) => {
        const db = admin.firestore()

        // get value of the newly added rating
        const ratingVal = (change.after.data() as { rating: number }).rating

        // get reference of the recipe
        const recipeRef = db.collection('recipes').doc(context.params.recipeId)

        // update aggregation in a transaction

        await db.runTransaction(async transaction => {
            const recipeDoc = await transaction.get(recipeRef)

            // compute new number of ratings
            const numRatings = (recipeDoc.data() as Recipe).numRatings || 0
            const newNumRatings = numRatings + 1

            const avgRatings = (recipeDoc.data() as Recipe).avgRating || 0

            // cupute new avrage rating
            const oldRatingTotal = avgRatings * numRatings
            const newAvgRating = (oldRatingTotal + ratingVal) / newNumRatings

            transaction.update(recipeRef, {
                avgRating: newAvgRating,
                numRatings: newNumRatings,
            })
        })

        change.after.data()
        change.before.data()
        context.auth?.uid
    })
