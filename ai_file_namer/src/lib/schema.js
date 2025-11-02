import { z } from 'zod';

// Define the schema for the incoming form data
export const FilenameSchema = z.object({
    // The name 'description' must match the 'name' attribute of the <textarea>
    description: z
        .string()
        .trim() // Removes leading/trailing whitespace
        .nonempty({ message: "A description is required to generate filenames." })
        .min(10, { message: "The description must be at least 10 characters long." })
        .max(500, { message: "The description is too long (max 500 characters)." }),
});