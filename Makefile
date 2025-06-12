.PHONY: setup sliding-puzzle solar-system motion-playground

setup:
	@yarn install

sliding-puzzle:
	@yarn workspace sliding-puzzle dev

solar-system:
        @yarn workspace solar-system dev

motion-playground:
        @yarn workspace motion-playground dev
