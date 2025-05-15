// --- canvas.js ---
// This file handles Canvas API interaction, data processing for Canvas,
// and rendering of Canvas-specific UI elements.

// Assume global variables like compassWorkerUrl, canvasDomain, canvasToken,
// canvasCourseMappings, allParsedEvents, fetchedCanvasCourses, ICONS,
// and utility functions like showMessageForCanvas, showCanvasDetailModal,
// processAndClassifyEvents, renderViews, renderCanvasClassListSidebar
// are defined in main.js and accessible here.
// This is a common pattern for simplicity in single-page apps,
// though modules would be used in larger builds.

async function fetchCanvasAPI(canvasApiEndpointWithPathAndQuery) {
    if (!compassWorkerUrl) {
        showMessageForCanvas('Cloudflare Worker URL not set in Settings.', 'error');
        return null;
    }
    if (!canvasDomain || !canvasToken) {
        showMessageForCanvas('Canvas Domain and API Token not set in Settings.', 'error');
        return null;
    }

    const workerPath = `${compassWorkerUrl}/canvas/${canvasApiEndpointWithPathAndQuery}`;
    const finalWorkerUrl = new URL(workerPath);
    // Append domain as a query parameter, ensuring '?' or '&' is used correctly
    if (finalWorkerUrl.search) { // If there are already query params in canvasApiEndpointWithPathAndQuery
        finalWorkerUrl.searchParams.append('domain', canvasDomain);
    } else {
        finalWorkerUrl.search = `?domain=${encodeURIComponent(canvasDomain)}`;
    }

    try {
        const response = await fetch(finalWorkerUrl.toString(), {
            headers: { 'Authorization': `Bearer ${canvasToken}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Worker error: ${response.status} ${response.statusText}` }));
            throw new Error(errorData.error || `Failed to fetch from Canvas via worker: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Canvas API Fetch Error via Worker:', error);
        showMessageForCanvas(`Error fetching from Canvas: ${error.message}. Check worker logs if issue persists.`, 'error');
        return null;
    }
}

async function fetchCanvasCourses(forceRefresh = false) {
    if (!forceRefresh && fetchedCanvasCourses && fetchedCanvasCourses.length > 0) {
        return fetchedCanvasCourses; // Return cached if not forcing refresh
    }
    // Added include[]=course_image and include[]=term to get more course details
    const courses = await fetchCanvasAPI('api/v1/courses?enrollment_state=active&include[]=term&include[]=course_image&per_page=50');
    if (courses) {
        fetchedCanvasCourses = courses.map(course => ({
            id: course.id,
            name: course.name || 'Unnamed Course',
            course_code: course.course_code || 'N/A',
            term: course.term ? course.term.name : 'N/A',
            start_at: course.start_at ? new Date(course.start_at) : null,
            image: course.image_download_url || (course.course_image || null), // Prefer download_url
            html_url: (canvasDomain.startsWith('http') ? canvasDomain : `https://${canvasDomain}`) + `/courses/${course.id}`
        }));
        return fetchedCanvasCourses;
    }
    fetchedCanvasCourses = []; // Clear cache on failure
    return [];
}

async function fetchAssignmentsForCourse(courseId) {
    const assignments = await fetchCanvasAPI(`api/v1/courses/${courseId}/assignments?order_by=due_at&bucket=upcoming&per_page=50`);
    return assignments || [];
}

async function fetchAnnouncementsForCourse(courseId) {
    // Fetch latest 5 announcements
    const announcements = await fetchCanvasAPI(`api/v1/announcements?context_codes[]=course_${courseId}&per_page=5`);
    return announcements || [];
}
async function fetchCourseSyllabus(courseId) {
    // The syllabus_body is often part of the main course object, but can also be fetched if needed
    // For simplicity, we'll assume it might be part of the course object fetched by fetchCanvasCourses if 'public_syllabus' is true
    // or you can fetch it separately if your Canvas instance has a specific endpoint or includes it in /api/v1/courses/:id
    const courseDetails = await fetchCanvasAPI(`api/v1/courses/${courseId}?include[]=syllabus_body`);
    return courseDetails ? courseDetails.syllabus_body : null;
}


async function processCanvasAssignmentsIntoEvents() {
    if (!compassWorkerUrl || !canvasDomain || !canvasToken) return;

    const courses = await fetchCanvasCourses(); // Ensures fetchedCanvasCourses is populated
    if (!courses || courses.length === 0) return;

    let newCanvasAssignmentEvents = [];
    for (const course of courses) {
        const assignments = await fetchAssignmentsForCourse(course.id);
        if (assignments && assignments.length > 0) {
            assignments.forEach(assignment => {
                if (assignment.due_at) {
                    const dueDate = new Date(assignment.due_at);
                    newCanvasAssignmentEvents.push({
                        id: `canvas-asgn-${assignment.id}`,
                        summary: `(Canvas) ${assignment.name}`,
                        originalSummary: `(Canvas) ${assignment.name} - ${course.name}`, // For potential classification
                        startDate: dueDate,
                        endDate: new Date(dueDate.getTime() + 30 * 60000), // Assume 30 min duration for display
                        location: `Canvas: ${course.name}`, // Use course name as location
                        description: assignment.html_url, // Link to assignment
                        isCanvasAssignment: true,
                        html_url: assignment.html_url,
                        color: 'hsl(0, 50%, 30%)' // Darker red for Canvas assignments in dark mode
                    });
                }
            });
        }
    }

    // Remove old Canvas assignments and add new ones to the global event list
    allParsedEvents = allParsedEvents.filter(event => !event.isCanvasAssignment);
    allParsedEvents.push(...newCanvasAssignmentEvents);
}


async function fetchCanvasData(forceRefreshCourses = false) {
    if (!compassWorkerUrl || !canvasDomain || !canvasToken) {
        showMessageForCanvas('Please set Worker URL, Canvas Domain and API Token in Settings.', 'info');
        return;
    }
    showMessageForCanvas('Loading Canvas data for Canvas Tab...', 'loading');

    const courses = await fetchCanvasCourses(forceRefreshCourses);
    renderCanvasClassListSidebar(); // Update sidebar as soon as courses are fetched

    if (!courses || courses.length === 0) {
        if (canvasDataMessageArea && !canvasDataMessageArea.textContent.includes('Error')) { // Don't overwrite error messages
             showMessageForCanvas('No active Canvas courses found or failed to load courses.', 'info');
        }
        return;
    }

    if(canvasCoursesDisplay) {
        canvasCoursesDisplay.innerHTML = ''; // Clear previous
        canvasCoursesDisplay.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
        let assignmentsFoundTotal = 0;

        for (const course of courses) {
            const courseCard = document.createElement('div');
            courseCard.className = 'canvas-item-card flex flex-col justify-between p-4 rounded-lg shadow-lg overflow-hidden h-full cursor-pointer neumorph-card';
            // Make the whole card clickable to open the detail modal
            courseCard.addEventListener('click', () => showCanvasDetailModal(course.id));


            let thumbnailHtml = `<div class="w-full h-32 bg-slate-700 flex items-center justify-center text-slate-500 rounded-md mb-3">No Image</div>`;
            if (course.image) {
                // Added onerror to handle broken image links gracefully
                thumbnailHtml = `<img src="${course.image}" alt="${course.name} thumbnail" class="w-full h-32 object-cover rounded-md mb-3" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                 <div class="w-full h-32 bg-slate-700 flex items-center justify-center text-slate-500 rounded-md mb-3" style="display:none;">No Image</div>`;
            }


            const assignmentsForThisCourse = await fetchAssignmentsForCourse(course.id);
            let assignmentsHtml = '<p class="text-xs text-slate-400 italic mt-2">No upcoming assignments.</p>';
            if (assignmentsForThisCourse && assignmentsForThisCourse.length > 0) {
                assignmentsFoundTotal += assignmentsForThisCourse.length;
                assignmentsHtml = '<ul class="text-xs space-y-1 mt-2 list-disc list-inside pl-1">';
                assignmentsForThisCourse.slice(0, 3).forEach(assignment => { // Show first 3
                    const dueDate = assignment.due_at ? new Date(assignment.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A';
                    assignmentsHtml += `<li><a href="${assignment.html_url}" target="_blank" class="hover:text-indigo-300">${assignment.name} (Due: ${dueDate})</a></li>`;
                });
                if (assignmentsForThisCourse.length > 3) {
                    assignmentsHtml += `<li>...and ${assignmentsForThisCourse.length - 3} more.</li>`;
                }
                assignmentsHtml += '</ul>';
            }

            courseCard.innerHTML = `
                <div>
                    ${thumbnailHtml}
                    <h3 class="text-md font-semibold text-indigo-400 mb-1 truncate" title="${course.name}">${course.name}</h3>
                    <p class="text-xs text-slate-400 mb-2 truncate" title="${course.course_code || 'ID: ' + course.id}">${course.course_code || 'ID: ' + course.id}</p>
                    ${assignmentsHtml}
                </div>
                <button class="btn btn-secondary btn-sm mt-3 self-start text-xs">View Details</button>
            `;
            canvasCoursesDisplay.appendChild(courseCard);
        }
        if (assignmentsFoundTotal > 0 && canvasCoursesDisplay) { showMessageForCanvas(`Loaded ${courses.length} courses. Displaying upcoming assignments.`, 'success');
        } else if (courses.length > 0 && canvasCoursesDisplay) { showMessageForCanvas(`Loaded ${courses.length} courses. No upcoming assignments found.`, 'info'); }
    }
}

function showMessageForCanvas(msg, type = 'info') {
    if(!canvasDataMessageArea) return;
    canvasDataMessageArea.innerHTML = ''; const msgElement = document.createElement('div'); let bgColor, textColor, borderColor, loader = ''; let autoDismiss = (type === 'success' || type === 'info');
    switch (type) { case 'error': bgColor = 'bg-red-900'; textColor = 'text-red-300'; borderColor = 'border-red-700'; break; case 'success': bgColor = 'bg-green-900'; textColor = 'text-green-300'; borderColor = 'border-green-700'; break; case 'loading': bgColor = 'bg-blue-900'; textColor = 'text-blue-300'; borderColor = 'border-blue-700'; loader = '<div class="loader !w-5 !h-5 !border-2 !inline-block !mr-2 !align-middle"></div>'; break; default: bgColor = 'bg-blue-900'; textColor = 'text-blue-300'; borderColor = 'border-blue-700';}
    msgElement.className = `p-3 ${bgColor} border-l-4 ${borderColor} ${textColor} rounded-md shadow-sm text-sm fade-in`; msgElement.innerHTML = loader + msg; canvasDataMessageArea.appendChild(msgElement);
    if (autoDismiss) { setTimeout(() => { if (canvasDataMessageArea.contains(msgElement)) { msgElement.classList.remove('fade-in'); msgElement.classList.add('fade-out'); msgElement.addEventListener('animationend', () => { if(canvasDataMessageArea.contains(msgElement)) canvasDataMessageArea.removeChild(msgElement); }, { once: true }); } }, 3000); }
}

function renderCanvasClassListSidebar() {
    if (!canvasClassListContainer || !canvasDomain) return;
    canvasClassListContainer.innerHTML = '';

    if (fetchedCanvasCourses.length === 0) {
        canvasClassListContainer.innerHTML = '<p class="text-xs text-slate-400 italic">No Canvas courses loaded. Check settings or Canvas tab.</p>';
        return;
    }

    const now = new Date();
    fetchedCanvasCourses
        .sort((a,b) => (a.name || "").localeCompare(b.name || ""))
        .forEach(course => {
        const courseLinkItem = document.createElement('div');
        courseLinkItem.className = "block p-1.5 rounded-md hover:bg-slate-700 transition-colors duration-150 cursor-pointer";
        courseLinkItem.onclick = (e) => { e.preventDefault(); showCanvasDetailModal(course.id); };


        let nextClassTimeStr = "";
        const mappedCompassName = Object.keys(canvasCourseMappings).find(key => canvasCourseMappings[key] === String(course.id));
        if(mappedCompassName) {
            const upcomingInstances = allParsedEvents.filter(e => !e.isCanvasAssignment && e.summary === mappedCompassName && e.startDate > now)
                                               .sort((a,b) => a.startDate - b.startDate);
            if(upcomingInstances.length > 0) {
                const nextInstance = upcomingInstances[0].startDate;
                const diffMs = nextInstance.getTime() - now.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                if (diffMs > 0) {
                    nextClassTimeStr = ` (Next: `;
                    if (diffDays > 0) nextClassTimeStr += `${diffDays}d `;
                    if (diffHours > 0) nextClassTimeStr += `${diffHours}h `;
                    nextClassTimeStr += `${diffMins}m)`;
                }
            }
        }

        courseLinkItem.innerHTML = `
            <span class="text-sm font-medium text-slate-200">${course.name}</span>
            ${nextClassTimeStr ? `<span class="canvas-class-next-time">${nextClassTimeStr}</span>` : ''}
            <span class="float-right text-indigo-400 text-xs">Details &rarr;</span>
        `;
        canvasClassListContainer.appendChild(courseLinkItem);
    });
}

async function showCanvasDetailModal(courseId) {
    if (!canvasDetailModal || !canvasDomain) return;
    const course = fetchedCanvasCourses.find(c => String(c.id) === String(courseId));
    if (!course) {
        showMessageForCanvas('Could not find course details.', 'error');
        return;
    }

    if(canvasDetailCourseName) canvasDetailCourseName.textContent = course.name || 'Course Details';
    if(canvasDetailCourseCode) canvasDetailCourseCode.textContent = course.course_code || 'N/A';
    if(canvasDetailCourseTerm) canvasDetailCourseTerm.textContent = course.term || 'N/A';
    if(canvasDetailCourseLink) canvasDetailCourseLink.href = course.html_url; // Use pre-constructed html_url

    if(canvasDetailAssignmentsList) canvasDetailAssignmentsList.innerHTML = '<div class="loader mx-auto my-4"></div>';
    if(canvasDetailAnnouncementsList) canvasDetailAnnouncementsList.innerHTML = '<p class="italic text-slate-400">Loading announcements...</p>';
    if(canvasDetailSyllabus) canvasDetailSyllabus.innerHTML = '<p class="italic text-slate-400">Loading syllabus...</p>';


    canvasDetailModal.classList.remove('hidden');
    setTimeout(() => {
        canvasDetailModal.classList.remove('opacity-0');
        if(canvasDetailModalContent) canvasDetailModalContent.classList.remove('scale-95');
    }, 10);


    const assignments = await fetchAssignmentsForCourse(course.id);
    if(canvasDetailAssignmentsList) {
        canvasDetailAssignmentsList.innerHTML = '';
        if (assignments && assignments.length > 0) {
            assignments.forEach(assignment => {
                const li = document.createElement('li');
                li.className = 'p-2 rounded-md hover:bg-slate-700 transition-colors';
                const dueDate = assignment.due_at ? new Date(assignment.due_at).toLocaleString() : 'No due date';
                li.innerHTML = `<a href="${assignment.html_url}" target="_blank" class="text-indigo-400 hover:underline">${assignment.name}</a> <span class="text-xs text-slate-400">- Due: ${dueDate}</span>`;
                canvasDetailAssignmentsList.appendChild(li);
            });
        } else {
            canvasDetailAssignmentsList.innerHTML = '<li class="text-slate-400 italic">No upcoming assignments for this course.</li>';
        }
    }

    const announcements = await fetchAnnouncementsForCourse(course.id);
    if(canvasDetailAnnouncementsList) {
        canvasDetailAnnouncementsList.innerHTML = '';
        if (announcements && announcements.length > 0) {
            announcements.slice(0, 5).forEach(announcement => {
                const item = document.createElement('div');
                item.className = 'p-2 rounded-md hover:bg-slate-700 transition-colors mb-1 text-sm';
                const postDate = new Date(announcement.posted_at).toLocaleDateString();
                const messageSnippet = announcement.message ? announcement.message.replace(/<[^>]*>/g, "").substring(0, 150) + '...' : '';
                item.innerHTML = `<h4 class="font-semibold text-slate-200">${announcement.title} <span class="text-xs text-slate-500">(${postDate})</span></h4>
                                  <div class="text-slate-400 text-xs mt-1">${messageSnippet}</div>
                                  <a href="${announcement.html_url}" target="_blank" class="text-indigo-400 hover:underline text-xs">Read more...</a>`;
                canvasDetailAnnouncementsList.appendChild(item);
            });
        } else {
            canvasDetailAnnouncementsList.innerHTML = '<p class="italic text-slate-400">No recent announcements for this course.</p>';
        }
    }

    const syllabusBody = await fetchCourseSyllabus(course.id);
    if (canvasDetailSyllabus) {
        if (syllabusBody) {
            // Basic sanitization: remove script tags. For full safety, use a proper HTML sanitizer library.
            const sanitizedSyllabus = syllabusBody.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
            canvasDetailSyllabus.innerHTML = sanitizedSyllabus;
        } else {
            canvasDetailSyllabus.innerHTML = '<p class="italic text-slate-400">Syllabus/Homepage content not available or not public.</p>';
        }
    }
}

function hideCanvasDetailModal() {
    if (!canvasDetailModal) return;
    canvasDetailModal.classList.add('opacity-0');
    if(canvasDetailModalContent) canvasDetailModalContent.classList.add('scale-95');
    setTimeout(() => {
        canvasDetailModal.classList.add('hidden');
    }, 300);
}
