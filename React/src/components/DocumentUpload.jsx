import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { UploadCloud, FileArchive, GraduationCap, User, Briefcase, FilePlus, CheckCircle, Trash2, AlertTriangle, Eye, FileText, X, Play } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { PDFDocument } from 'pdf-lib';
import imageCompression from 'browser-image-compression';

const checkBlurry = async (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Aggressively downscale to 400px for lightning-fast edge detection math
                const maxDim = 400;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const imageData = ctx.getImageData(0, 0, width, height);
                const { data } = imageData;
                const grayscale = new Float32Array(width * height);
                for (let i = 0; i < data.length; i += 4) {
                    grayscale[i/4] = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                }
                
                let sum = 0, sumSq = 0, count = 0;
                const endY = height - 1;
                const endX = width - 1;
                for (let y = 1; y < endY; y++) {
                    let yOffset = y * width;
                    for (let x = 1; x < endX; x++) {
                        const i = yOffset + x;
                        const lap = grayscale[i - width] + grayscale[i - 1] + grayscale[i + 1] + grayscale[i + width] - 4 * grayscale[i];
                        sum += lap;
                        sumSq += lap * lap;
                        count++;
                    }
                }
                
                URL.revokeObjectURL(img.src);
                
                if (count === 0) {
                    resolve(false);
                    return;
                }
                const mean = sum / count;
                const variance = (sumSq / count) - (mean * mean);
                
                resolve(variance < 50); // <50 usually indicates a blurry document image
            } catch (err) {
                console.error("Blur check logic error:", err);
                resolve(false); // Failsafe: if calculation fails, just allow the upload
            }
        };
        img.onerror = () => resolve(false);
        img.src = URL.createObjectURL(file);
    });
};


const DocumentUpload = forwardRef(({ profile, setMessage }, ref) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState({});

    const handleFileChange = async (e, id) => {
        const inputElement = e.target;
        const files = Array.from(inputElement.files || []);
        if (files.length === 0) {
            setAttachedFiles(prev => ({ ...prev, [id]: false }));
            return;
        }

        if (setMessage) setMessage('Checking image quality & optimizing...');

        const dt = new DataTransfer();
        let hasError = false;

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            
            if (file.type.startsWith('image/')) {
                // 1. Check for blur
                const isBlurry = await checkBlurry(file);
                if (isBlurry) {
                    if (setMessage) {
                        setMessage(`Error: The image "${file.name}" is too blurry. Please upload a clear, legible document.`);
                    }
                    inputElement.value = '';
                    setAttachedFiles(prev => ({ ...prev, [id]: false }));
                    hasError = true;
                    setTimeout(() => { if (setMessage) setMessage(''); }, 6000);
                    return; 
                }
                
                // 2. Compress if > 1MB without noticeable quality degrade
                if (file.size > 1024 * 1024) {
                    try {
                        const options = {
                            maxSizeMB: 1.5,
                            maxWidthOrHeight: 1600,
                            useWebWorker: true,  // WebWorker unblocks UI Thread
                            maxIteration: 1,     // Force Single-Pass! Disables the dreaded 8-second multi-pass loop
                            initialQuality: 0.70 // High enough to be clean, low enough to single-pass under 1MB quickly
                        };
                        const compressedBlob = await imageCompression(file, options);
                        file = new File([compressedBlob], file.name, { type: compressedBlob.type, lastModified: Date.now() });
                    } catch (err) {
                        console.error('Compression error:', err);
                    }
                }
            }
            dt.items.add(file);
        }
        
        if (!hasError) {
            inputElement.files = dt.files;
            if (setMessage) setMessage('');
            setAttachedFiles(prev => ({
                ...prev,
                [id]: dt.files.length > 0
            }));
        }
    };

    const removeDocument = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        const fileInput = document.getElementById(id);
        if (fileInput) fileInput.value = '';
        setAttachedFiles(prev => {
            const newState = { ...prev };
            newState[id] = false;
            return newState;
        });
    };

    const triggerPreview = (id) => {
        const fileInput = document.getElementById(id);
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const fileURL = URL.createObjectURL(fileInput.files[0]);
            window.open(fileURL, '_blank');
        }
    };

    useImperativeHandle(ref, () => ({
        executeProcessing,
        isProcessing,
        triggerPreview,
        getAttachedFilesInfo: () => {
            const documentInfos = [];
            const ids = [
                { id: 'tenth', label: '10th Marksheet' },
                { id: 'twelfth', label: '12th Marksheet' },
                { id: 'degree', label: 'Degree' },
                { id: 'transcript', label: 'Transcript' },
                { id: 'passport_front', label: 'Passport (Front)' },
                { id: 'passport_back', label: 'Passport (Back)' },
                { id: 'aadhar_front', label: 'Aadhar (Front)' },
                { id: 'aadhar_back', label: 'Aadhar (Back)' },
                { id: 'teams_id', label: 'Teams ID' },
                { id: 'photo', label: 'Photograph' },
                { id: 'sop', label: 'SOP' },
                { id: 'ielts', label: 'IELTS' },
                { id: 'moi', label: 'MOI' },
                { id: 'cv', label: 'CV / Resume' },
                { id: 'work_exp', label: 'Work Experience' },
                { id: 'lor1', label: 'LOR 1' },
                { id: 'lor2', label: 'LOR 2' },
                { id: 'study_module', label: 'Study Module' },
                { id: 'bonafide', label: 'Bonafide' },
                { id: 'fiscal', label: 'Fiscal' }
            ];
            ids.forEach(({id, label}) => {
                const el = document.getElementById(id);
                if(el && el.files && el.files.length > 0) {
                    documentInfos.push({ id, label, fileName: el.files[0].name });
                }
            });
            return documentInfos;
        }
    }));

    const viewDocument = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        triggerPreview(id);
    };

    const StatusIndicator = ({ id }) => {
        if (!attachedFiles[id]) return null;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="#22c55e" />
                <button type="button" onClick={(e) => viewDocument(e, id)} 
                  style={{ background: 'rgba(56, 189, 248, 0.1)', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }} 
                  title="View Document">
                    <Eye size={13} />
                </button>
                <button type="button" onClick={(e) => removeDocument(e, id)} 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }} 
                  title="Remove Document">
                    <Trash2 size={13} />
                </button>
            </div>
        );
    };

    useEffect(() => {
        const fileBoxes = document.querySelectorAll('.file-box');
        fileBoxes.forEach(box => {
            box.addEventListener('dragover', e => { e.preventDefault(); box.classList.add('dragover'); });
            box.addEventListener('dragleave', e => { e.preventDefault(); box.classList.remove('dragover'); });
            box.addEventListener('drop', e => {
                e.preventDefault();
                box.classList.remove('dragover');
                const input = box.querySelector('input[type="file"]');
                if (input) {
                    input.files = e.dataTransfer.files;
                    // manually trigger change event for react state 
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                }
            });
        });
    }, []);

    const executeProcessing = async (onProgress, summaryData) => {
        const nameInput = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'CANDIDATE';

        setIsProcessing(true);
        if (onProgress) onProgress(5);
        setMessage('Compiling & Uploading Documents... Please wait.');

        try {
            const candidateNameUpper = nameInput.toUpperCase() || 'CANDIDATE';
            const generatedFiles = [];

            const documentTypes = [
                { id: 'tenth', prefix: '10TH' },
                { id: 'twelfth', prefix: '12TH' },
                { id: 'degree', prefix: 'DEGREE' },
                { id: 'transcript', prefix: 'TRANSCRIPT' },
                { id: 'teams_id', prefix: 'TEAMS - ID' },
                { id: 'photo', prefix: 'PHOTO' },
                { id: 'sop', prefix: 'SOP' },
                { id: 'ielts', prefix: 'IELTS' },
                { id: 'moi', prefix: 'MOI' },
                { id: 'lor1', prefix: 'LOR-1' },
                { id: 'lor2', prefix: 'LOR-2' },
                { id: 'study_module', prefix: 'STUDY-MODULE' },
                { id: 'work_exp', prefix: 'WORK EXPERIENCE' },
                { id: 'cv', prefix: 'CV' },
                { id: 'bonafide', prefix: 'BONAFIDE' },
                { id: 'fiscal', prefix: 'FISCAL' }
            ];

            let filesProcessed = 0;

            async function createAndAddPDFToZip(filesArray, finalFileName) {
                const mergedPdf = await PDFDocument.create();
                let addedPages = 0;

                for (let j = 0; j < filesArray.length; j++) {
                    const file = filesArray[j];
                    const arrayBuffer = await file.arrayBuffer();

                    if (file.type.startsWith('image/')) {
                        let image;
                        try {
                            image = await mergedPdf.embedJpg(arrayBuffer);
                        } catch (jpgError) {
                            try {
                                image = await mergedPdf.embedPng(arrayBuffer);
                            } catch (pngError) {
                                generatedFiles.push(new File([arrayBuffer], `${finalFileName.replace('.pdf', '')}_RAW.${file.name.split('.').pop()}`, { type: file.type || 'application/octet-stream' }));
                                continue;
                            }
                        }
                        const page = mergedPdf.addPage([image.width, image.height]);
                        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                        addedPages++;
                    } else if (file.type === 'application/pdf') {
                        const loadedPdf = await PDFDocument.load(arrayBuffer);
                        const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                        addedPages++;
                    } else {
                        generatedFiles.push(new File([arrayBuffer], `${finalFileName.replace('.pdf', '')}_RAW.${file.name.split('.').pop()}`, { type: file.type || 'application/octet-stream' }));
                    }
                }

                if (addedPages > 0) {
                    const pdfBytes = await mergedPdf.save({ useObjectStreams: false });
                    generatedFiles.push(new File([pdfBytes], finalFileName, { type: 'application/pdf' }));
                }
            }

            // Process Standard Single-Input Document Types
            for (let i = 0; i < documentTypes.length; i++) {
                const doc = documentTypes[i];
                if (onProgress) onProgress(5 + Math.floor((i / documentTypes.length) * 40));
                const fileInput = document.getElementById(doc.id);
                if (!fileInput) continue;

                const files = Array.from(fileInput.files);
                if (files.length === 0) continue;
                filesProcessed++;

                try {
                    const needsPdfEngine = files.length > 1 || files.some(f => f.type.startsWith('image/'));
                    if (doc.id === 'photo') {
                        const file = files[0];
                        const extension = file.name.split('.').pop();
                        const arrayBuffer = await file.arrayBuffer();
                        generatedFiles.push(new File([arrayBuffer], `${doc.prefix} -- ${candidateNameUpper}.${extension}`, { type: file.type || 'application/octet-stream' }));
                    } else if (needsPdfEngine) {
                        await createAndAddPDFToZip(files, `${doc.prefix} -- ${candidateNameUpper}.pdf`);
                    } else {
                        const file = files[0];
                        const extension = file.name.split('.').pop();
                        const arrayBuffer = await file.arrayBuffer();
                        generatedFiles.push(new File([arrayBuffer], `${doc.prefix} -- ${candidateNameUpper}.${extension}`, { type: file.type || 'application/octet-stream' }));
                    }
                } catch (error) {
                    console.error(`Error with ${doc.prefix}:`, error);
                }
            }

            // Process Passport (Front + Back)
            const passFront = Array.from(document.getElementById('passport_front')?.files || []);
            const passBack = Array.from(document.getElementById('passport_back')?.files || []);
            if (passFront.length > 0 || passBack.length > 0) {
                filesProcessed++;
                try {
                    await createAndAddPDFToZip([...passFront, ...passBack], `PASSPORT -- ${candidateNameUpper}.pdf`);
                } catch (e) { }
            }

            // Process Aadhar (Front + Back)
            const aadharFront = Array.from(document.getElementById('aadhar_front')?.files || []);
            const aadharBack = Array.from(document.getElementById('aadhar_back')?.files || []);
            if (aadharFront.length > 0 || aadharBack.length > 0) {
                filesProcessed++;
                try {
                    await createAndAddPDFToZip([...aadharFront, ...aadharBack], `AADHAR -- ${candidateNameUpper}.pdf`);
                } catch (e) { }
            }

            // COMBINED COMBINATIONS
            const photoFiles = Array.from(document.getElementById('photo')?.files || []);
            if (photoFiles.length > 0) {
                try { await createAndAddPDFToZip(photoFiles, `PHOTO_PDF -- ${candidateNameUpper}.pdf`); } catch (error) { }
            }

            const tenthFiles = Array.from(document.getElementById('tenth')?.files || []);
            const twelfthFiles = Array.from(document.getElementById('twelfth')?.files || []);
            if (tenthFiles.length > 0 && twelfthFiles.length > 0) {
                try { await createAndAddPDFToZip([...twelfthFiles, ...tenthFiles], `12TH-10TH -- ${candidateNameUpper}.pdf`); } catch (error) { }
            }

            const degreeFiles = Array.from(document.getElementById('degree')?.files || []);
            const transcriptFiles = Array.from(document.getElementById('transcript')?.files || []);
            if (degreeFiles.length > 0 && transcriptFiles.length > 0) {
                try { await createAndAddPDFToZip([...degreeFiles, ...transcriptFiles], `DEGREE - TRANSCRIPT -- ${candidateNameUpper}.pdf`); } catch (error) { }
            }

            if (degreeFiles.length > 0 && transcriptFiles.length > 0 && twelfthFiles.length > 0 && tenthFiles.length > 0) {
                try { await createAndAddPDFToZip([...degreeFiles, ...transcriptFiles, ...twelfthFiles, ...tenthFiles], `DEGREE - TRANSCRIPT - 12TH - 10TH -- ${candidateNameUpper}.pdf`); } catch (error) { }
            }

            const cvFiles = Array.from(document.getElementById('cv')?.files || []);
            const workExpFiles = Array.from(document.getElementById('work_exp')?.files || []);
            if (cvFiles.length > 0 && workExpFiles.length > 0) {
                try { await createAndAddPDFToZip([...cvFiles, ...workExpFiles], `CV - WORK EXPERIENCE -- ${candidateNameUpper}.pdf`); } catch (error) { }
            }

            const ieltsFiles = Array.from(document.getElementById('ielts')?.files || []);
            const moiFiles = Array.from(document.getElementById('moi')?.files || []);
            if (ieltsFiles.length > 0 && moiFiles.length > 0) {
                try { await createAndAddPDFToZip([...ieltsFiles, ...moiFiles], `IELTS -- MOI -- ${candidateNameUpper}.pdf`); } catch (error) { }
            }

            const lor1Files = Array.from(document.getElementById('lor1')?.files || []);
            const lor2Files = Array.from(document.getElementById('lor2')?.files || []);
            if (lor1Files.length > 0 && lor2Files.length > 0) {
                try { await createAndAddPDFToZip([...lor1Files, ...lor2Files], `LOR'S -- ${candidateNameUpper}.pdf`); } catch (error) { }
            }

            if (generatedFiles.length === 0) {
                setMessage('No files were attached to upload.');
                setIsProcessing(false);
                return;
            }

            // 1. Send Multiple Documents to Backend
            const formData = new FormData();
            generatedFiles.forEach(file => {
               formData.append('documents', file, file.name);
            });
            formData.append('email', profile?.email || '');
            formData.append('candidateName', candidateNameUpper);
            if (summaryData) {
                formData.append('summaryData', JSON.stringify(summaryData));
            }

            setMessage('Generating ZIP and sending email...');

            const response = await fetch(`${API_BASE_URL}/upload/email-zip`, {
      credentials: 'include',
                method: 'POST',
                body: formData
            });

            if (onProgress) onProgress(90);

            if (response.ok) {
                if (onProgress) onProgress(100);
                setMessage(`Success! Documents zipped and sent to ${profile.email}`);
            } else {
                setMessage(`ZIP created, but email failed.`);
            }

            // Local download disabled



            // reset attached UI states simply by clearing state 
            setAttachedFiles({});

        } catch (error) {
            console.error("Upload Error:", error);
            setMessage(`Upload Error: ${error.message || 'Unknown error'}`);
        }

        setTimeout(() => setMessage(''), 4000);
        setIsProcessing(false);
    };

    return (
        <div className="view-standard" style={{ gap: '20px' }}>
            <div style={{ padding: '0 5px 5px 5px' }}>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Candidate Document Upload</h2>
            </div>

            <div className="profile-card full-width edit-card" style={{ display: 'block', background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}>
                <div className="doc-upload-grid" style={{ marginTop: '0' }}>

                    {/* Education Records */}
                    <div className="doc-category-card">
                        <div className="doc-category-header">
                            <GraduationCap className="category-icon" />
                            <h3>Education</h3>
                        </div>
                        <div className="doc-category-body">
                            <div className={`file-box ${attachedFiles['tenth'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>10th Marksheet</label>
                                    <StatusIndicator id="tenth" />
                                </div>
                                <input type="file" id="tenth" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'tenth')} />
                            </div>
                            <div className={`file-box ${attachedFiles['twelfth'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>12th Marksheet</label>
                                    <StatusIndicator id="twelfth" />
                                </div>
                                <input type="file" id="twelfth" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'twelfth')} />
                            </div>
                            <div className={`file-box ${attachedFiles['degree'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Degree</label>
                                    <StatusIndicator id="degree" />
                                </div>
                                <input type="file" id="degree" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'degree')} />
                            </div>
                            <div className={`file-box ${attachedFiles['transcript'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Transcript</label>
                                    <StatusIndicator id="transcript" />
                                </div>
                                <input type="file" id="transcript" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'transcript')} />
                            </div>
                        </div>
                    </div>

                    {/* Identity & Profile */}
                    <div className="doc-category-card">
                        <div className="doc-category-header">
                            <User className="category-icon" />
                            <h3>Identity</h3>
                        </div>
                        <div className="doc-category-body">
                            <div className={`file-box ${attachedFiles['passport_front'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Passport (Front)</label>
                                    <StatusIndicator id="passport_front" />
                                </div>
                                <input type="file" id="passport_front" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'passport_front')} />
                            </div>
                            <div className={`file-box ${attachedFiles['passport_back'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Passport (Back)</label>
                                    <StatusIndicator id="passport_back" />
                                </div>
                                <input type="file" id="passport_back" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'passport_back')} />
                            </div>
                            <div className={`file-box ${attachedFiles['aadhar_front'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Aadhar (Front)</label>
                                    <StatusIndicator id="aadhar_front" />
                                </div>
                                <input type="file" id="aadhar_front" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'aadhar_front')} />
                            </div>
                            <div className={`file-box ${attachedFiles['aadhar_back'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Aadhar (Back)</label>
                                    <StatusIndicator id="aadhar_back" />
                                </div>
                                <input type="file" id="aadhar_back" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'aadhar_back')} />
                            </div>
                            <div className={`file-box ${attachedFiles['teams_id'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Teams ID</label>
                                    <StatusIndicator id="teams_id" />
                                </div>
                                <input type="file" id="teams_id" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'teams_id')} />
                            </div>
                            <div className={`file-box ${attachedFiles['photo'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Photograph</label>
                                    <StatusIndicator id="photo" />
                                </div>
                                <input type="file" id="photo" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'photo')} />
                            </div>
                        </div>
                    </div>

                    {/* Language, Experience & LORs */}
                    <div className="doc-category-card">
                        <div className="doc-category-header">
                            <Briefcase className="category-icon" />
                            <h3>Language & Careers</h3>
                        </div>
                        <div className="doc-category-body">
                            <div className={`file-box ${attachedFiles['sop'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>SOP</label>
                                    <StatusIndicator id="sop" />
                                </div>
                                <input type="file" id="sop" accept="application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'sop')} />
                            </div>
                            <div className={`file-box ${attachedFiles['ielts'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>IELTS</label>
                                    <StatusIndicator id="ielts" />
                                </div>
                                <input type="file" id="ielts" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'ielts')} />
                            </div>
                            <div className={`file-box ${attachedFiles['moi'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>MOI</label>
                                    <StatusIndicator id="moi" />
                                </div>
                                <input type="file" id="moi" accept="image/*,application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'moi')} />
                            </div>
                            <div className={`file-box ${attachedFiles['cv'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>CV / Resume</label>
                                    <StatusIndicator id="cv" />
                                </div>
                                <input type="file" id="cv" accept="application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'cv')} />
                            </div>
                            <div className={`file-box ${attachedFiles['work_exp'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Work Exp</label>
                                    <StatusIndicator id="work_exp" />
                                </div>
                                <input type="file" id="work_exp" accept="image/*,application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'work_exp')} />
                            </div>
                            <div className={`file-box ${attachedFiles['lor1'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>LOR 1</label>
                                    <StatusIndicator id="lor1" />
                                </div>
                                <input type="file" id="lor1" accept="image/*,application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'lor1')} />
                            </div>
                            <div className={`file-box ${attachedFiles['lor2'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>LOR 2</label>
                                    <StatusIndicator id="lor2" />
                                </div>
                                <input type="file" id="lor2" accept="image/*,application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'lor2')} />
                            </div>
                        </div>
                    </div>

                    {/* Additional Documents */}
                    <div className="doc-category-card">
                        <div className="doc-category-header">
                            <FilePlus className="category-icon" />
                            <h3>Additional Docs</h3>
                        </div>
                        <div className="doc-category-body">
                            <div className={`file-box ${attachedFiles['study_module'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Study Module</label>
                                    <StatusIndicator id="study_module" />
                                </div>
                                <input type="file" id="study_module" accept="application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'study_module')} />
                            </div>
                            <div className={`file-box ${attachedFiles['bonafide'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Bonafide</label>
                                    <StatusIndicator id="bonafide" />
                                </div>
                                <input type="file" id="bonafide" accept="image/*,application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'bonafide')} />
                            </div>
                            <div className={`file-box ${attachedFiles['fiscal'] ? 'attached' : ''}`}>
                                <div className="file-label-wrap">
                                    <label>Fiscal</label>
                                    <StatusIndicator id="fiscal" />
                                </div>
                                <input type="file" id="fiscal" accept="image/*,application/pdf,.doc,.docx" multiple onChange={(e) => handleFileChange(e, 'fiscal')} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default DocumentUpload;
