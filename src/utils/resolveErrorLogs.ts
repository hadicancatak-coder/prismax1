import { errorLogger } from "@/lib/errorLogger";

/**
 * Utility to mark multiple error logs as resolved
 * This is used to clean up errors that have been fixed
 */
export async function resolveErrorLogs(errorIds: string[]) {
  const results = await Promise.allSettled(
    errorIds.map(id => errorLogger.resolveError(id))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.filter(r => r.status === 'rejected' || !r.value).length;
  
  console.log(`Resolved ${successful} errors, ${failed} failed`);
  
  return { successful, failed };
}

/**
 * Mark all previously fixed errors as resolved
 * Call this from browser console: resolveAllFixedErrors()
 */
export async function resolveAllFixedErrors() {
  const errorIds = [
    // Select.Item empty string errors (fixed in Operations.tsx)
    '21af0281-445b-40dc-bf27-65e2f6290b57',
    'bad3ec4f-80d2-4d7f-aa43-148b33c4dacd',
    'ad51c3ab-8c53-4ca8-aeb1-df3e37d78fd8',
    'cb08deba-14b4-4e48-8f11-40e301feaa89',
    'd6a3f50d-207e-4c67-a5ed-5755e405e711',
    '9f83c2a4-d5db-4215-891a-b0734ec22bfd',
    '6a115a46-ed64-4b40-b4c2-fa52ef9789a4',
    'e3bd444d-9a68-41a9-b75f-63d4a83f839f',
    '91c80630-baca-4c7d-b3fe-5a2791b9d7d4',
    // useDefaultAssignees errors (fixed by adding import)
    '390f0b20-6dc2-4a05-865a-7d063411693b',
    '3987b1a2-ddc8-45e4-93ff-618782803e54',
    '0fd644bd-022a-4ef8-8a9f-ecca2ff22b96',
    'e9022d75-f729-4580-b120-42125632cc6a',
    'f1e7e565-0a89-49ef-887a-2524908fac00',
    'ebf583c5-95ea-464d-ad7d-d2b5421d83d6',
    // Old handleSaveScopeOfWork error (obsolete code)
    '0d87cbc8-49da-480a-988e-cbfbe8737194',
    // Unhandled Promise Rejections (fixed by adding try-catch)
    'a9dadbcc-ec66-4c7f-80a8-ad5b71e92c18',
    '13b566c4-3d60-40ea-abb9-455889b8c6ef',
  ];
  
  return await resolveErrorLogs(errorIds);
}
