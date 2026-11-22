CREATE TABLE `history` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`date` text NOT NULL,
	`name` text,
	`file_path` text
);
--> statement-breakpoint
CREATE INDEX `idx_history_date_id` ON `history` (`date`,`id`);