//after end profile user 
`
	<!-- Start User profile description --
    <div class="p-4 user-profile-desc" data-simplebar>
        <div id="settingprofile" class="accordion">
            <div class="accordion-item card border mb-2">
                <div class="accordion-header" id="personalinfo1">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#personalinfo" aria-expanded="true" aria-controls="personalinfo">
                        <h5 class="font-size-14 m-0">Personal Info</h5>
                    </button>
                </div>
                <div id="personalinfo" class="accordion-collapse collapse show" aria-labelledby="personalinfo1" data-bs-parent="#settingprofile">
                    <div class="accordion-body">
                        <div class="float-end">
                            <button type="button" class="btn btn-light btn-sm"><i class="ri-edit-fill me-1 ms-0 align-middle"></i> Edit</button>
                        </div>

                        <div>
                            <p class="text-muted mb-1">Name</p>
                            <h5 class="font-size-14">Patricia Smith</h5>
                        </div>

                        <div class="mt-4">
                            <p class="text-muted mb-1">Email</p>
                            <h5 class="font-size-14">adc@123.com</h5>
                        </div>

                        <div class="mt-4">
                            <p class="text-muted mb-1">Time</p>
                            <h5 class="font-size-14">11:40 AM</h5>
                        </div>

                        <div class="mt-4">
                            <p class="text-muted mb-1">Location</p>
                            <h5 class="font-size-14 mb-0">California, USA</h5>
                        </div>
                    </div>
                </div>
            </div>
            <!-- end personal info card --

            <div class="accordion-item card border mb-2">
                <div class="accordion-header" id="privacy1">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#privacy" aria-expanded="false" aria-controls="privacy">
                        <h5 class="font-size-14 m-0">Privacy</h5>
                    </button>
                </div>
                <div id="privacy" class="accordion-collapse collapse" aria-labelledby="privacy1" data-bs-parent="#settingprofile">
                    <div class="accordion-body">
                        <div class="py-3">
                            <div class="d-flex align-items-center">
                                <div class="flex-1 overflow-hidden">
                                    <h5 class="font-size-13 mb-0 text-truncate">Profile photo</h5>
                                </div>
                                <div class="dropdown ms-2 me-0">
                                    <button class="btn btn-light btn-sm dropdown-toggle w-sm" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Everyone <i class="mdi mdi-chevron-down"></i>
                                    </button>
                                    <div class="dropdown-menu dropdown-menu-end">
                                        <a class="dropdown-item" href="#">Everyone</a>
                                        <a class="dropdown-item" href="#">selected</a>
                                        <a class="dropdown-item" href="#">Nobody</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="py-3 border-top">
                            <div class="d-flex align-items-center">
                                <div class="flex-1 overflow-hidden">
                                    <h5 class="font-size-13 mb-0 text-truncate">Last seen</h5>

                                </div>
                                <div class="ms-2 me-0">
                                    <div class="form-check form-switch">
                                        <input type="checkbox" class="form-check-input" id="privacy-lastseenSwitch" checked>
                                        <label class="form-check-label" for="privacy-lastseenSwitch"></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="py-3 border-top">
                            <div class="d-flex align-items-center">
                                <div class="flex-1 overflow-hidden">
                                    <h5 class="font-size-13 mb-0 text-truncate">Status</h5>
                                </div>
                                <div class="dropdown ms-2 me-0">
                                    <button class="btn btn-light btn-sm dropdown-toggle w-sm" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Everyone <i class="mdi mdi-chevron-down"></i>
                                    </button>
                                    <div class="dropdown-menu dropdown-menu-end">
                                        <a class="dropdown-item" href="#">Everyone</a>
                                        <a class="dropdown-item" href="#">selected</a>
                                        <a class="dropdown-item" href="#">Nobody</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="py-3 border-top">
                            <div class="d-flex align-items-center">
                                <div class="flex-1 overflow-hidden">
                                    <h5 class="font-size-13 mb-0 text-truncate">Read receipts</h5>
                                </div>
                                <div class="ms-2 me-0">
                                    <div class="form-check form-switch">
                                        <input type="checkbox" class="form-check-input" id="privacy-readreceiptSwitch" checked>
                                        <label class="form-check-label" for="privacy-readreceiptSwitch"></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="py-3 border-top">
                            <div class="d-flex align-items-center">
                                <div class="flex-1 overflow-hidden">
                                    <h5 class="font-size-13 mb-0 text-truncate">Groups</h5>

                                </div>
                                <div class="dropdown ms-2 me-0">
                                    <button class="btn btn-light btn-sm dropdown-toggle w-sm" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Everyone <i class="mdi mdi-chevron-down"></i>
                                    </button>
                                    <div class="dropdown-menu dropdown-menu-end">
                                        <a class="dropdown-item" href="#">Everyone</a>
                                        <a class="dropdown-item" href="#">selected</a>
                                        <a class="dropdown-item" href="#">Nobody</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- end privacy card --

            <div class="accordion-item card border mb-2">
                <div class="accordion-header" id="security1">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#security" aria-expanded="false" aria-controls="security">
                        <h5 class="font-size-14 m-0"></i> Security</h5>
                    </button>
                </div>
                <div id="security" class="accordion-collapse collapse" aria-labelledby="security1" data-bs-parent="#settingprofile">
                    <div class="accordion-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-1 overflow-hidden">
                                <h5 class="font-size-13 mb-0 text-truncate">Show security notification</h5>

                            </div>
                            <div class="ms-2 me-0">
                                <div class="form-check form-switch">
                                    <input type="checkbox" class="form-check-input" id="security-notificationswitch">
                                    <label class="form-check-label" for="security-notificationswitch"></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- end security card --

            <div class="accordion-item card border mb-2">
                <div class="accordion-header" id="help1">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                        <h5 class="font-size-14 m-0"></i> Help</h5>
                    </button>
                </div>
                <div id="collapseFour" class="accordion-collapse collapse" aria-labelledby="help1" data-bs-parent="#settingprofile">
                    <div class="accordion-body">
                        <div class="py-3">
                            <h5 class="font-size-13 mb-0"><a href="#" class="text-body d-block">FAQs</a></h5>
                        </div>
                        <div class="py-3 border-top">
                            <h5 class="font-size-13 mb-0"><a href="#" class="text-body d-block">Contact</a></h5>
                        </div>
                        <div class="py-3 border-top">
                            <h5 class="font-size-13 mb-0"><a href="#" class="text-body d-block">Terms & Privacy policy</a></h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- end profile-setting-accordion --
    </div>
    <!-- End User profile description -->
`;