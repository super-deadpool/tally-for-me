import mongoose from "mongoose";
import { MONGO_URI, PORT } from "./environment.js";
import { app } from "./app.js";

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
