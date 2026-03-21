import { QMSRecord } from './googleSheets';
import { getFileMetadata, listFolderFiles, extractFileId, extractFolderId } from './driveService';

export interface AuditRecordResult {
  recordCode: string;
  recordName: string;
  category: string;
  
  // Phase 1: Record Integrity
  templateStatus: 'valid' | 'invalid' | 'missing_link' | 'duplicate';
  folderStatus: 'valid' | 'invalid' | 'missing_link' | 'wrong_name' | 'duplicate' | 'not_a_folder';
  
  // Phase 2: File Sequence Integrity
  sequenceStatus: 'valid' | 'broken' | 'empty' | 'no_serial_parsing' | 'not_checked';
  
  suggestedStatus: 'approved' | 'rejected' | 'pending_review';
  suggestedFixes?: { id: string; currentName: string; suggestedName: string; type: 'folder' | 'file' }[];
  missingSerials: number[];
  issues: string[];
}

function extractSequenceNumber(fileName: string): number | null {
  // First try the strict QMS format F/XX-YYY
  const matchF = fileName.match(/F\/\d+-(\d+)/i);
  if (matchF && matchF[1]) return parseInt(matchF[1], 10);
  
  // Try finding a 3 digit number preceded by spaces, dash, or underscore (e.g., "Form - 001.pdf")
  const matchExact = fileName.match(/[\s_-](\d{3})\b/);
  if (matchExact && matchExact[1]) return parseInt(matchExact[1], 10);

  // Fallback: Try finding any block of digits up to 4 digits long
  // We exclude 4 digit numbers that look like years (e.g., 2023, 2024)
  const matches = fileName.match(/\b\d{1,4}\b/g);
  if (matches) {
    const validMatches = matches.filter(m => {
      const n = parseInt(m, 10);
      return n < 1900 || n > 2100; // Ignore likely years
    });
    if (validMatches.length > 0) {
      return parseInt(validMatches[validMatches.length - 1], 10);
    }
  }
  return null;
}

export async function runAutomatedAudit(
  records: QMSRecord[], 
  onProgress?: (current: number, total: number, recordCode: string) => void
): Promise<AuditRecordResult[]> {
  const results: AuditRecordResult[] = [];
  const total = records.length;

  const usedTemplateIds = new Map<string, string>(); // id -> first record code
  const usedFolderIds = new Map<string, string>();   // id -> first record code

  for (let i = 0; i < total; i++) {
    const record = records[i];
    if (onProgress) {
      onProgress(i + 1, total, record.code);
    }

    const result: AuditRecordResult = {
      recordCode: record.code,
      recordName: record.recordName,
      category: record.category,
      templateStatus: 'missing_link',
      folderStatus: 'missing_link',
      sequenceStatus: 'not_checked',
      suggestedStatus: 'pending_review',
      missingSerials: [],
      issues: []
    };

    // PHASE 1: Link & Name Integrity
    
    // 1. Verify Template Link
    let templateId: string | null = null;
    if (record.templateLink && record.templateLink.trim() !== "") {
      templateId = extractFileId(record.templateLink);
      if (!templateId) {
        result.templateStatus = 'invalid';
        result.issues.push("Template link is malformed or invalid.");
      } else {
        // Uniqueness check
        if (usedTemplateIds.has(templateId)) {
          result.templateStatus = 'duplicate';
          result.issues.push(`Duplicate Template: same link used in ${usedTemplateIds.get(templateId)}`);
        } else {
          usedTemplateIds.set(templateId, record.code);
          const metadata = await getFileMetadata(templateId);
          if (!metadata) {
            result.templateStatus = 'invalid';
            result.issues.push("Template file inaccessible in Google Drive.");
          } else {
            // Name Check
            if (!metadata.name.toLowerCase().includes(record.code.toLowerCase())) {
              result.issues.push(`Template name mismatch: "${metadata.name}" (expected code "${record.code}")`);
              result.templateStatus = 'invalid';
            } else {
              result.templateStatus = 'valid';
            }
          }
        }
      }
    } else {
      result.issues.push("Missing template link.");
    }

    // 2. Verify Folder Link (saved folder)
    let folderId: string | null = null;
    if (record.folderLink && record.folderLink.trim() !== "" && !record.folderLink.includes("No Files Yet")) {
      folderId = extractFolderId(record.folderLink);
      if (!folderId) {
        result.folderStatus = 'invalid';
        result.issues.push("Folder link is malformed or invalid.");
      } else {
        // Uniqueness check
        if (usedFolderIds.has(folderId)) {
          result.folderStatus = 'duplicate';
          result.issues.push(`Duplicate Folder: same link used in ${usedFolderIds.get(folderId)}`);
        } else {
          usedFolderIds.set(folderId, record.code);
          const driveFolder = await getFileMetadata(folderId);
          
          if (!driveFolder) {
            result.folderStatus = 'invalid';
            result.issues.push("Folder inaccessible in Google Drive.");
          } else if (driveFolder.mimeType && !driveFolder.mimeType.includes('folder')) {
             result.folderStatus = 'not_a_folder';
             result.issues.push(`Target is a File, not a Folder: "${driveFolder.name}"`);
          } else {
            // Folder Name Check
            const folderName = driveFolder.name;
            const folderNameLower = folderName.toLowerCase();
            const recordCodeLower = record.code.toLowerCase();
            
            if (!folderNameLower.includes(recordCodeLower)) {
              const suggestedFolderName = `${record.code} - ${record.recordName}`;
              result.issues.push(`Folder name mismatch: "${driveFolder.name}" (expected code "${record.code}")`);
              result.folderStatus = 'wrong_name';
              
              if (!result.suggestedFixes) result.suggestedFixes = [];
              result.suggestedFixes.push({
                id: folderId,
                currentName: driveFolder.name,
                suggestedName: suggestedFolderName,
                type: 'folder'
              });
            } else {
              result.folderStatus = 'valid';
            }

            // PHASE 2: File Sequence Integrity (Only if Phase 1 for folder is mostly okay)
            if (result.folderStatus === 'valid' || result.folderStatus === 'wrong_name') {
              const files = await listFolderFiles(record.folderLink);
              if (files && files.length > 0) {
                const extractedSerials: number[] = [];
                let failedParses = 0;

                files.forEach(f => {
                  const seq = extractSequenceNumber(f.name);
                  if (seq !== null) {
                    extractedSerials.push(seq);
                  } else {
                    failedParses++;
                  }
                });

                if (extractedSerials.length === 0) {
                  result.sequenceStatus = 'no_serial_parsing';
                  result.issues.push(`No serial numbers detected in any of the ${files.length} files.`);
                } else {
                  const uniqueSerials = [...new Set(extractedSerials)].sort((a, b) => a - b);
                  const maxSerial = uniqueSerials[uniqueSerials.length - 1];
                  const missing: number[] = [];

                  for (let j = 1; j < maxSerial; j++) {
                    if (!uniqueSerials.includes(j)) {
                      missing.push(j);
                    }
                  }

                  if (missing.length > 0) {
                    result.sequenceStatus = 'broken';
                    result.missingSerials = missing;
                    result.issues.push(`Missing records in sequence: ${missing.join(', ')}`);
                  } else {
                    result.sequenceStatus = 'valid';
                  }

                  if (failedParses > 0) {
                    result.issues.push(`Warning: ${failedParses} file(s) had no identifiable serial number.`);
                  }
                }
              } else {
                result.sequenceStatus = 'empty';
              }
            }
          }
        }
      }
    } else {
      result.issues.push("Missing folder link.");
    }

    // Suggested Status Calculation
    if (result.issues.some(iss => !iss.startsWith("Warning:"))) {
      result.suggestedStatus = 'rejected';
    } else if (result.templateStatus === 'valid' && result.folderStatus === 'valid' && 
               (result.sequenceStatus === 'valid' || result.sequenceStatus === 'empty')) {
      result.suggestedStatus = 'approved';
    } else {
      result.suggestedStatus = 'pending_review';
    }

    results.push(result);
  }

  return results;
}
