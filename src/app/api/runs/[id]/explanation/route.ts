export const dynamic = 'force-dynamic';

import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { ExplanationService } from '../../../../../server/services/ExplanationService';

const explanationService = new ExplanationService();

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;

  try {
    await connectToDatabase();

    const explanation = await explanationService.generate(id);

    if (!explanation) {
      return errorResponse('Execution not found', undefined, 404);
    }

    return successResponse(explanation, 'Explanation generated successfully');
  } catch (error) {
    return errorResponse('Failed to generate explanation', error, 500);
  }
}
