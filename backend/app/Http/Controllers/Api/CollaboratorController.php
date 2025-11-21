<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectPlan;
use App\Models\PlanCollaborator;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CollaboratorController extends Controller
{
    /**
     * Get all collaborators for a plan
     */
    public function getPlanCollaborators(Request $request, $planId)
    {
        $plan = ProjectPlan::with('uploader')->find($planId);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        // Get collaborators with user details
        $collaborators = PlanCollaborator::where('plan_id', $planId)
            ->with('user:id,fullname,email')
            ->get()
            ->map(function ($collab) {
                return [
                    'id' => $collab->id,
                    'user_id' => $collab->user_id,
                    'name' => $collab->user->fullname ?? 'Unknown',
                    'email' => $collab->user->email ?? '',
                    'role' => $collab->role,
                    'last_viewed' => $collab->last_viewed_at ? $collab->last_viewed_at->toISOString() : null,
                    'last_edited' => $collab->last_edited_at ? $collab->last_edited_at->toISOString() : null,
                ];
            });

        // Add plan owner
        $owner = [
            'user_id' => $plan->uploaded_by,
            'name' => $plan->uploader->fullname ?? 'Unknown',
            'email' => $plan->uploader->email ?? '',
            'role' => 'owner',
            'last_edited' => $plan->updated_at->toISOString(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'owner' => $owner,
                'collaborators' => $collaborators,
            ]
        ]);
    }

    /**
     * Add a collaborator to a plan
     */
    public function addCollaborator(Request $request, $planId)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:owner,editor,viewer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $plan = ProjectPlan::find($planId);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        // Check if user is admin or plan owner
        if ($request->user() && $request->user()->role !== 'admin' && $plan->uploaded_by !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only plan owner or admin can add collaborators'
            ], 403);
        }

        try {
            $collaborator = PlanCollaborator::updateOrCreate(
                [
                    'plan_id' => $planId,
                    'user_id' => $request->user_id,
                ],
                [
                    'role' => $request->role,
                ]
            );

            $user = User::find($request->user_id);

            return response()->json([
                'success' => true,
                'message' => 'Collaborator added successfully',
                'data' => [
                    'id' => $collaborator->id,
                    'user_id' => $collaborator->user_id,
                    'name' => $user->fullname ?? 'Unknown',
                    'email' => $user->email ?? '',
                    'role' => $collaborator->role,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add collaborator: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update collaborator role
     */
    public function updateCollaboratorRole(Request $request, $planId, $collaboratorId)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:owner,editor,viewer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $collaborator = PlanCollaborator::where('plan_id', $planId)
            ->where('id', $collaboratorId)
            ->first();

        if (!$collaborator) {
            return response()->json([
                'success' => false,
                'message' => 'Collaborator not found'
            ], 404);
        }

        $collaborator->update(['role' => $request->role]);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => [
                'role' => $collaborator->role
            ]
        ]);
    }

    /**
     * Remove collaborator from plan
     */
    public function removeCollaborator(Request $request, $planId, $collaboratorId)
    {
        $collaborator = PlanCollaborator::where('plan_id', $planId)
            ->where('id', $collaboratorId)
            ->first();

        if (!$collaborator) {
            return response()->json([
                'success' => false,
                'message' => 'Collaborator not found'
            ], 404);
        }

        $collaborator->delete();

        return response()->json([
            'success' => true,
            'message' => 'Collaborator removed successfully'
        ]);
    }

    /**
     * Get teams for a plan
     */
    public function getPlanTeams(Request $request, $planId)
    {
        $plan = ProjectPlan::find($planId);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        $teams = Team::whereHas('plans', function ($query) use ($planId) {
            $query->where('project_plans.id', $planId);
        })
        ->withCount('members')
        ->get()
        ->map(function ($team) {
            return [
                'id' => $team->id,
                'name' => $team->name,
                'icon' => $team->icon,
                'members_count' => $team->members_count,
                'is_pro' => $team->is_pro,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    /**
     * Get all teams (for listing)
     */
    public function getAllTeams(Request $request)
    {
        $teams = Team::withCount('members')
            ->orderBy('name')
            ->get()
            ->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'icon' => $team->icon,
                    'description' => $team->description,
                    'members_count' => $team->members_count,
                    'is_pro' => $team->is_pro,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    /**
     * Create a new team
     */
    public function createTeam(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:10',
            'description' => 'nullable|string',
            'is_pro' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $team = Team::create([
                'name' => $request->name,
                'icon' => $request->icon ?? strtoupper(substr($request->name, 0, 1)),
                'description' => $request->description,
                'is_pro' => $request->is_pro ?? false,
                'created_by' => $request->user() ? $request->user()->id : 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Team created successfully',
                'data' => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'icon' => $team->icon,
                    'description' => $team->description,
                    'is_pro' => $team->is_pro,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create team: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign team to plan
     */
    public function assignTeamToPlan(Request $request, $planId)
    {
        $validator = Validator::make($request->all(), [
            'team_id' => 'required|exists:teams,id',
            'permission' => 'required|in:view,edit',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $plan = ProjectPlan::find($planId);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        $team = Team::find($request->team_id);

        // Attach team to plan
        $plan->teams()->syncWithoutDetaching([
            $request->team_id => ['permission' => $request->permission]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Team assigned to plan successfully'
        ]);
    }

    /**
     * Remove team from plan
     */
    public function removeTeamFromPlan(Request $request, $planId, $teamId)
    {
        $plan = ProjectPlan::find($planId);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        $plan->teams()->detach($teamId);

        return response()->json([
            'success' => true,
            'message' => 'Team removed from plan successfully'
        ]);
    }
}

