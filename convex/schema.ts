import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";



export default defineSchema({
    users: defineTable({
        userId: v.string(),
        email: v.string(),
        createdAt: v.number(),
        // Optional fields
        name: v.optional(v.string()),
        profileImage: v.optional(v.string()),
    }).index("by_userId", ["userId"]).index("by_name", ["name"]).index("by_email", ["email"]),
})