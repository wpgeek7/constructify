<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MeasurementDiscipline;
use App\Models\ProjectPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DisciplineController extends Controller
{
    /**
     * Get all disciplines for a plan
     */
    public function index(Request $request, $planId)
    {
        $plan = ProjectPlan::find($planId);
        
        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        $disciplines = MeasurementDiscipline::where('plan_id', $planId)
            ->orderBy('order')
            ->with('measurements')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $disciplines
        ]);
    }

    /**
     * Create a new discipline
     */
    public function store(Request $request, $planId)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
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

        // If no order specified, put it at the end
        if (!$request->has('order')) {
            $maxOrder = MeasurementDiscipline::where('plan_id', $planId)->max('order');
            $request->merge(['order' => ($maxOrder ?? 0) + 1]);
        }

        $discipline = MeasurementDiscipline::create([
            'plan_id' => $planId,
            'name' => $request->name,
            'icon' => $request->icon ?? '📁',
            'color' => $request->color ?? '#82eaff',
            'order' => $request->order,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Discipline created successfully',
            'data' => $discipline
        ], 201);
    }

    /**
     * Update a discipline
     */
    public function update(Request $request, $planId, $id)
    {
        $discipline = MeasurementDiscipline::where('plan_id', $planId)->find($id);
        
        if (!$discipline) {
            return response()->json([
                'success' => false,
                'message' => 'Discipline not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $discipline->update($request->only(['name', 'icon', 'color', 'order']));

        return response()->json([
            'success' => true,
            'message' => 'Discipline updated successfully',
            'data' => $discipline
        ]);
    }

    /**
     * Delete a discipline
     */
    public function destroy($planId, $id)
    {
        $discipline = MeasurementDiscipline::where('plan_id', $planId)->find($id);
        
        if (!$discipline) {
            return response()->json([
                'success' => false,
                'message' => 'Discipline not found'
            ], 404);
        }

        $discipline->delete();

        return response()->json([
            'success' => true,
            'message' => 'Discipline deleted successfully'
        ]);
    }

    /**
     * Reorder disciplines
     */
    public function reorder(Request $request, $planId)
    {
        $validator = Validator::make($request->all(), [
            'disciplines' => 'required|array',
            'disciplines.*.id' => 'required|integer|exists:measurement_disciplines,id',
            'disciplines.*.order' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        foreach ($request->disciplines as $item) {
            MeasurementDiscipline::where('plan_id', $planId)
                ->where('id', $item['id'])
                ->update(['order' => $item['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Disciplines reordered successfully'
        ]);
    }
}

