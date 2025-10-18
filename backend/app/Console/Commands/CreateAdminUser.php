<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin {--email=} {--name=} {--password=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Creating Admin User...');
        $this->newLine();

        // Get input
        $name = $this->option('name') ?: $this->ask('Full Name');
        $email = $this->option('email') ?: $this->ask('Email');
        $password = $this->option('password') ?: $this->secret('Password (min 8 characters)');

        // Validate
        $validator = Validator::make([
            'fullname' => $name,
            'email' => $email,
            'password' => $password,
        ], [
            'fullname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            $this->error('Validation failed:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('  - ' . $error);
            }
            return Command::FAILURE;
        }

        // Check if admin already exists
        $adminCount = User::where('role', 'admin')->count();
        if ($adminCount > 0) {
            $this->warn("Warning: {$adminCount} admin user(s) already exist.");
            if (!$this->confirm('Do you want to create another admin?', false)) {
                $this->info('Operation cancelled.');
                return Command::SUCCESS;
            }
        }

        // Create admin user
        try {
            $user = User::create([
                'name' => $name,
                'fullname' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
                'is_verified' => true,
                'email_verified_at' => Carbon::now(),
            ]);

            $this->newLine();
            $this->info('✓ Admin user created successfully!');
            $this->newLine();
            $this->table(
                ['Field', 'Value'],
                [
                    ['ID', $user->id],
                    ['Name', $user->fullname],
                    ['Email', $user->email],
                    ['Role', $user->role],
                    ['Status', 'Verified'],
                ]
            );
            $this->newLine();

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to create admin user: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
